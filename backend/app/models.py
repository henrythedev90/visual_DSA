"""Pydantic models — the contract between the FastAPI backend and the Next.js frontend.

Keep this file in sync with `frontend/lib/types.ts`.
"""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class HighlightRole(str, Enum):
    """What a highlighted index means on a given step.

    The frontend maps each role to a distinct bar color.
    """

    COMPARING = "comparing"  # elements currently being compared
    SWAPPING = "swapping"  # elements about to be / being swapped
    SORTED = "sorted"  # elements confirmed in final position
    PIVOT = "pivot"  # pivot element (quicksort)
    MERGING = "merging"  # elements involved in a merge step (merge sort)
    ACTIVE_RANGE = "active_range"  # current subarray being worked on


class Highlight(BaseModel):
    index: int
    role: HighlightRole


class TraceStep(BaseModel):
    """One visually meaningful moment in an algorithm's execution."""

    step: int
    array: List[int]
    highlights: List[Highlight] = []
    message: str  # human-readable caption, e.g. "Comparing 5 and 3"
    comparisons: int = 0  # running total
    swaps: int = 0  # running total (includes shifts / placements)


class TraceResponse(BaseModel):
    algorithm: str
    input: List[int]
    total_steps: int
    steps: List[TraceStep]


class AlgorithmInfo(BaseModel):
    id: str
    name: str
    category: str  # "sorting" for v1
    description: str


class TraceRequest(BaseModel):
    """Optional POST body alternative to query params."""

    array: Optional[List[int]] = None
    size: Optional[int] = None
