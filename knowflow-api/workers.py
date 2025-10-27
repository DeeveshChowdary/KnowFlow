"""Placeholder for background processing workers.

In production this module would host the queue consumer that pulls jobs from
Upstash Redis (or another broker) and runs the heavyweight NLP pipeline.
For the prototype we keep the implementation minimal and synchronous within
FastAPI background tasks, but this file documents the intended structure so
it is easy to swap in a proper worker later.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass(slots=True)
class WorkerJob:
    name: str
    handler: Callable[..., None]


def run_worker(job: WorkerJob) -> None:
    """Run a single job handler (placeholder for RQ/Dramatiq entrypoint)."""
    job.handler()


__all__ = ["WorkerJob", "run_worker"]
