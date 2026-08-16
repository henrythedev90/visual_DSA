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
    category: str  # "sorting" | "graph"
    description: str


class TraceRequest(BaseModel):
    """Optional POST body alternative to query params."""

    array: Optional[List[int]] = None
    size: Optional[int] = None


# --- Graph / pathfinding (v2). Sorting models above are unchanged. ---

Cell = tuple[int, int]


class NodeState(str, Enum):
    UNVISITED = "unvisited"
    FRONTIER = "frontier"  # in the queue/stack/priority-queue, not yet visited
    VISITED = "visited"
    CURRENT = "current"  # node being processed right now
    PATH = "path"  # part of the final found path
    WALL = "wall"  # obstacle, not traversable
    START = "start"
    END = "end"


class GridNode(BaseModel):
    row: int
    col: int
    state: NodeState
    distance: Optional[float] = None  # running distance/cost, for Dijkstra


class GraphTraceStep(BaseModel):
    step: int
    grid: List[List[GridNode]]  # full grid state at this step
    message: str
    visited_count: int = 0
    frontier_count: int = 0


class GraphTraceResponse(BaseModel):
    algorithm: str
    rows: int
    cols: int
    start: Cell
    end: Cell
    walls: List[Cell]
    total_steps: int
    steps: List[GraphTraceStep]


class GraphTraceRequest(BaseModel):
    rows: int = 20
    cols: int = 20
    start: Cell
    end: Cell
    walls: List[Cell] = []
