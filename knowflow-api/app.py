"""FastAPI application for the KnowFlow backend."""
from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, HttpUrl

from knowflow.models import Paper, PaperStatus
from knowflow.schemas import (
    GraphResponseSchema,
    PaperStatusSchema,
    SearchResponseSchema,
    SearchResultSchema,
)
from knowflow.services.processing import (
    simulate_edges,
    simulate_nodes,
    simulate_sentences,
    simulate_summary,
)
from knowflow.services.search import hybrid_search
from knowflow.services.storage import store

app = FastAPI(title="KnowFlow API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ArxivIngestRequest(BaseModel):
    url: HttpUrl


class IngestResponse(BaseModel):
    paper_id: UUID


async def _process_paper(paper: Paper, text: str) -> None:
    store.set_processing(paper.paper_id)
    try:
        sentences = simulate_sentences(paper.paper_id, text)
        nodes = simulate_nodes(sentences)
        edges = simulate_edges(nodes)
        summary = simulate_summary(sentences)
        store.upsert_result(
            paper.paper_id,
            nodes=nodes,
            edges=edges,
            summary=summary,
            sentences=sentences,
        )
    except Exception as exc:  # pragma: no cover
        store.set_error(paper.paper_id, str(exc))


@app.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> IngestResponse:
    content = await file.read()
    text = content.decode("utf-8", errors="ignore") or "Placeholder content for empty PDF"
    paper = store.create_paper(title=file.filename or "Untitled PDF", source="upload")
    background_tasks.add_task(_process_paper, paper, text)
    return IngestResponse(paper_id=paper.paper_id)


@app.post("/ingest/arxiv", response_model=IngestResponse)
async def ingest_arxiv(background_tasks: BackgroundTasks, payload: ArxivIngestRequest) -> IngestResponse:
    paper = store.create_paper(title="arXiv draft", source=payload.url)
    background_tasks.add_task(
        _process_paper,
        paper,
        f"Synthetic content pulled from {payload.url}",
    )
    return IngestResponse(paper_id=paper.paper_id)


@app.get("/paper/{paper_id}/status", response_model=PaperStatusSchema)
async def get_status(paper_id: UUID) -> PaperStatusSchema:
    paper = store.get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="paper not found")
    return PaperStatusSchema(
        paper_id=paper.paper_id,
        title=paper.title,
        status=paper.status.value,
        created_at=paper.created_at,
        updated_at=paper.updated_at,
        error_message=paper.error_message,
    )


def _paper_to_graph_response(paper: Paper) -> GraphResponseSchema:
    return GraphResponseSchema(
        paper_id=paper.paper_id,
        title=paper.title,
        summary=paper.summary,
        nodes=paper.nodes,
        edges=paper.edges,
    )


@app.get("/paper/{paper_id}/graph", response_model=GraphResponseSchema)
async def get_graph(paper_id: UUID) -> GraphResponseSchema:
    paper = store.get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="paper not found")
    if paper.status != PaperStatus.READY:
        raise HTTPException(status_code=409, detail=f"paper is {paper.status.value}")
    return _paper_to_graph_response(paper)


@app.get("/search", response_model=SearchResponseSchema)
async def search(query: str) -> SearchResponseSchema:
    sentences = [sentence for paper in store.list_papers() for sentence in paper.sentences]
    hits = hybrid_search(query, sentences)
    return SearchResponseSchema(
        query=query,
        results=[
            SearchResultSchema(
                paper_id=sentence.paper_id,
                sentence_id=sentence.sentence_id,
                section=sentence.section,
                text=sentence.text,
                score=score,
            )
            for sentence, score in hits
        ],
    )


@app.get("/export/{paper_id}.{file_format}")
async def export(paper_id: UUID, file_format: Literal["json", "txt"]) -> JSONResponse | PlainTextResponse:
    paper = store.get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="paper not found")
    if paper.status != PaperStatus.READY:
        raise HTTPException(status_code=409, detail=f"paper is {paper.status.value}")
    if file_format == "json":
        payload = _paper_to_graph_response(paper).model_dump()
        return JSONResponse(payload)
    summary_text = "\n".join(bullet.text for bullet in paper.summary)
    return PlainTextResponse(summary_text or "No summary available")
