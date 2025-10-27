"""Naive hybrid search combining keyword hits with embedding dot-product."""
from __future__ import annotations

import math
from typing import Iterable, List

from ..models import Sentence


def hybrid_search(query: str, sentences: Iterable[Sentence]) -> List[tuple[Sentence, float]]:
    if not query:
        return []
    q_tokens = set(query.lower().split())
    hits: List[tuple[Sentence, float]] = []
    for sentence in sentences:
        sent_tokens = set(sentence.text.lower().split())
        overlap = len(q_tokens & sent_tokens)
        dot = sum(sentence.embedding) / (len(sentence.embedding) or 1)
        score = overlap + math.tanh(dot)
        if score > 0:
            hits.append((sentence, score))
    hits.sort(key=lambda item: item[1], reverse=True)
    return hits[:10]
