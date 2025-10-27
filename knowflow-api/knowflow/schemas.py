"""Pydantic schemas for API responses."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EvidenceSpanSchema(BaseModel):
    sentence_id: UUID = Field(examples=["6b4c6cda-..."])
    text: str
    section: str


class NodeSchema(BaseModel):
    node_id: UUID
    label: str
    type: str
    summary: str
    score: float
    evidence: List[EvidenceSpanSchema] = []


class EdgeSchema(BaseModel):
    edge_id: UUID
    src: UUID
    dst: UUID
    relation: str
    confidence: float
    evidence: Optional[EvidenceSpanSchema] = None


class SummaryBulletSchema(BaseModel):
    section: str
    text: str
    weight: float


class PaperStatusSchema(BaseModel):
    paper_id: UUID
    title: str
    status: Literal["queued", "processing", "ready", "error"]
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None


class GraphResponseSchema(BaseModel):
    paper_id: UUID
    title: str
    summary: List[SummaryBulletSchema]
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]


class SearchResultSchema(BaseModel):
    paper_id: UUID
    sentence_id: UUID
    section: str
    text: str
    score: float


class SearchResponseSchema(BaseModel):
    query: str
    results: List[SearchResultSchema]
