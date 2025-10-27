# KnowFlow

KnowFlow (formerly ExplainGraph) turns dense research papers into explorable knowledge
graphs and concise bullet summaries. This repository hosts both the FastAPI backend
prototype and the Next.js/Tailwind frontend described in the PRD above.

## Repository layout

```
knowflow-api/   # FastAPI service with ingest/search/export endpoints
knowflow-web/   # Next.js 14 frontend with Cytoscape graph viewer
```

## What’s implemented

- ✅ PDF + arXiv ingest endpoints that simulate the planned NLP/IR pipeline and return
  nodes, edges, evidence spans, and summary bullets.
- ✅ Export/status/search routes that mirror the MVP contract so the frontend can be
  exercised without waiting on the full pipeline.
- ✅ Next.js UI with upload + arXiv forms, Cytoscape graph, summary cards, semantic
  search list, and evidence side panel. A demo graph is bundled for offline play.
- ✅ Clear seams (services/processing, services/search, workers.py) so spaCy, YAKE,
  pgvector, and Redis workers can be slotted in when ready.

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm/npm/yarn (examples below use npm)

### Backend (FastAPI)

```bash
cd knowflow-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The current pipeline is synthetic but the module layout matches the PRD:

- `services/processing.py` ⇒ placeholder for PyMuPDF + spaCy + YAKE + relation rules.
- `services/storage.py` ⇒ in-memory store today; swap for Postgres/pgvector DAO.
- `services/search.py` ⇒ lightweight hybrid scorer; replace with pgvector + FTS queries.

### Frontend (Next.js + Tailwind)

```bash
cd knowflow-web
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the API is not on `localhost:8000`.
The homepage ships with a “Load demo graph” button so the UI can be previewed even
without the backend running.

## Workflow

1. Upload a PDF or submit an arXiv URL.
2. Poll `/paper/{id}/status` until it becomes `ready`.
3. Once ready, fetch `/paper/{id}/graph` for nodes/edges/summary and render in the UI.
4. Query `/search?q=...` for hybrid semantic + keyword hits across ingested papers.
5. Export JSON or TXT via `/export/{paper_id}.json|.txt`.

## Next steps

1. Replace the synthetic processors with the real NLP stack (PyMuPDF, spaCy/SciSpaCy,
   YAKE, rule-based relations, pgvector embeddings).
2. Persist data in Neon/Postgres instead of the in-memory store and wire up RQ/Dramatiq
   workers via Upstash Redis.
3. Implement export/download endpoints for PNG graph captures and JSON schema parity.
4. Flesh out front-end filters (entity type, relation, confidence) and add node/edge
   thumbs-up telemetry once backend endpoints are live.
