"""Domain models used internally by the KnowFlow backend."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4


class PaperStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


@dataclass(slots=True)
class EvidenceSpan:
    sentence_id: UUID
    text: str
    section: str


@dataclass(slots=True)
class Node:
    node_id: UUID
    label: str
    type: str
    summary: str
    score: float
    evidence: List[EvidenceSpan] = field(default_factory=list)


@dataclass(slots=True)
class Edge:
    edge_id: UUID
    src: UUID
    dst: UUID
    relation: str
    confidence: float
    evidence: Optional[EvidenceSpan] = None


@dataclass(slots=True)
class SummaryBullet:
    section: str
    text: str
    weight: float


@dataclass(slots=True)
class Sentence:
    sentence_id: UUID
    paper_id: UUID
    section: str
    text: str
    embedding: List[float]


@dataclass(slots=True)
class Paper:
    paper_id: UUID
    title: str
    source: str
    status: PaperStatus = PaperStatus.QUEUED
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    nodes: List[Node] = field(default_factory=list)
    edges: List[Edge] = field(default_factory=list)
    summary: List[SummaryBullet] = field(default_factory=list)
    sentences: List[Sentence] = field(default_factory=list)
    error_message: Optional[str] = None

    @classmethod
    def new(cls, title: str, source: str) -> "Paper":
        return cls(paper_id=uuid4(), title=title, source=source)

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
