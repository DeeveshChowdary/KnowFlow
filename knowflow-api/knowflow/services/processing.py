"""Synthetic processing pipeline that mimics the real NLP stack."""
from __future__ import annotations

import random
from textwrap import wrap
from typing import Iterable, List
from uuid import UUID, uuid4

from ..models import Edge, EvidenceSpan, Node, Sentence, SummaryBullet

_SECTIONS = ["abstract", "introduction", "method", "experiments"]
_RELATIONS = ["uses", "improves_on", "evaluated_on", "reports"]
_TYPES = ["Model", "Dataset", "Metric", "Task"]


def _seed_rng(paper_id: UUID) -> random.Random:
    seed = int(str(paper_id).replace("-", ""), 16) % (2**32)
    return random.Random(seed)


def simulate_sentences(paper_id: UUID, text: str) -> List[Sentence]:
    rand = _seed_rng(paper_id)
    chunks = [chunk.strip() for chunk in wrap(text, 120) if chunk.strip()]
    sentences: List[Sentence] = []
    for idx, chunk in enumerate(chunks):
        sentences.append(
            Sentence(
                sentence_id=uuid4(),
                paper_id=paper_id,
                section=rand.choice(_SECTIONS),
                text=chunk,
                embedding=[rand.random() for _ in range(4)],
            )
        )
    return sentences or [
        Sentence(
            sentence_id=uuid4(),
            paper_id=paper_id,
            section="abstract",
            text=text,
            embedding=[rand.random() for _ in range(4)],
        )
    ]


def simulate_nodes(sentences: Iterable[Sentence]) -> List[Node]:
    rand = random.Random(sum(int(s.sentence_id.int & 0xFFFF) for s in sentences))
    nodes: List[Node] = []
    for sentence in sentences[:8]:
        nodes.append(
            Node(
                node_id=uuid4(),
                label=sentence.text.split(" ")[0:3][0].title()
                if sentence.text
                else "Entity",
                type=rand.choice(_TYPES),
                summary=sentence.text[:140],
                score=rand.random(),
                evidence=[
                    EvidenceSpan(
                        sentence_id=sentence.sentence_id,
                        text=sentence.text,
                        section=sentence.section,
                    )
                ],
            )
        )
    return nodes


def simulate_edges(nodes: List[Node]) -> List[Edge]:
    rand = random.Random(sum(int(node.node_id.int & 0xFFFF) for node in nodes))
    edges: List[Edge] = []
    for idx in range(0, len(nodes) - 1, 2):
        edges.append(
            Edge(
                edge_id=uuid4(),
                src=nodes[idx].node_id,
                dst=nodes[idx + 1].node_id,
                relation=rand.choice(_RELATIONS),
                confidence=rand.random(),
                evidence=nodes[idx].evidence[0] if nodes[idx].evidence else None,
            )
        )
    return edges


def simulate_summary(sentences: Iterable[Sentence]) -> List[SummaryBullet]:
    bullets: List[SummaryBullet] = []
    for sentence in sentences:
        bullets.append(
            SummaryBullet(section=sentence.section.title(), text=sentence.text[:200], weight=0.5)
        )
        if len(bullets) == 5:
            break
    return bullets
