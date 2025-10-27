"""Simple in-memory store for prototype purposes."""
from __future__ import annotations

from threading import Lock
from typing import Dict, Iterable, List, Optional
from uuid import UUID

from ..models import Edge, Node, Paper, PaperStatus, Sentence, SummaryBullet


class InMemoryStore:
    def __init__(self) -> None:
        self._papers: Dict[UUID, Paper] = {}
        self._lock = Lock()

    def create_paper(self, title: str, source: str) -> Paper:
        paper = Paper.new(title=title, source=source)
        with self._lock:
            self._papers[paper.paper_id] = paper
        return paper

    def get_paper(self, paper_id: UUID) -> Optional[Paper]:
        return self._papers.get(paper_id)

    def set_processing(self, paper_id: UUID) -> None:
        paper = self._papers[paper_id]
        paper.status = PaperStatus.PROCESSING
        paper.touch()

    def set_error(self, paper_id: UUID, message: str) -> None:
        paper = self._papers[paper_id]
        paper.status = PaperStatus.ERROR
        paper.error_message = message
        paper.touch()

    def upsert_result(
        self,
        paper_id: UUID,
        *,
        nodes: Iterable[Node],
        edges: Iterable[Edge],
        summary: Iterable[SummaryBullet],
        sentences: Iterable[Sentence],
    ) -> Paper:
        paper = self._papers[paper_id]
        paper.nodes = list(nodes)
        paper.edges = list(edges)
        paper.summary = list(summary)
        paper.sentences = list(sentences)
        paper.status = PaperStatus.READY
        paper.touch()
        return paper

    def list_papers(self) -> List[Paper]:
        return list(self._papers.values())


store = InMemoryStore()
