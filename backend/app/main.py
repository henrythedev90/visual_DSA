"""FastAPI routes. Algorithm logic lives in `app.algorithms` — keep it out of here."""

from __future__ import annotations

import asyncio
import random
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.algorithms import ALGORITHM_REGISTRY, get_category, get_trace_fn
from app.models import (
    AlgorithmInfo,
    GraphTraceRequest,
    GraphTraceResponse,
    GraphTraceStep,
    GridNode,
    Highlight,
    TraceRequest,
    TraceResponse,
    TraceStep,
)

MIN_SIZE = 2
MAX_SIZE = 100
DEFAULT_SIZE = 15
RANDOM_VALUE_MIN = 1
RANDOM_VALUE_MAX = 100

MIN_GRID = 5
MAX_GRID = 50

Cell = Tuple[int, int]

app = FastAPI(
    title="DSA Visualizer API",
    description="Step-by-step traces of sorting and pathfinding algorithms.",
    version="2.0.0",
)

# Wide open for local development. Tighten allow_origins before any real deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _available_ids() -> List[str]:
    return list(ALGORITHM_REGISTRY.keys())


def _require_algorithm(algorithm: str) -> None:
    if algorithm not in ALGORITHM_REGISTRY:
        ids = ", ".join(_available_ids())
        raise HTTPException(
            status_code=404,
            detail=f"Unknown algorithm '{algorithm}'. Available: {ids}",
        )


def _require_category(algorithm: str, expected: str) -> None:
    _require_algorithm(algorithm)
    actual = get_category(algorithm)
    if actual != expected:
        if expected == "sorting":
            raise HTTPException(
                status_code=400,
                detail=(
                    f"'{algorithm}' is a graph algorithm. "
                    f"Use POST /api/graph-trace/{algorithm} or WS /ws/trace/{algorithm}."
                ),
            )
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{algorithm}' is a sorting algorithm. "
                f"Use GET/POST /api/trace/{algorithm} or WS /ws/trace/{algorithm}."
            ),
        )


def _validate_array(values: List[int]) -> None:
    if not MIN_SIZE <= len(values) <= MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Array must have between {MIN_SIZE} and {MAX_SIZE} elements "
                f"(got {len(values)})."
            ),
        )


def _random_array(size: int) -> List[int]:
    if not MIN_SIZE <= size <= MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"size must be between {MIN_SIZE} and {MAX_SIZE} (got {size}).",
        )
    pool_size = RANDOM_VALUE_MAX - RANDOM_VALUE_MIN + 1
    if size > pool_size:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot generate {size} unique values from {pool_size} possible integers.",
        )
    return random.sample(range(RANDOM_VALUE_MIN, RANDOM_VALUE_MAX + 1), size)


def _parse_array_query(array: Optional[str]) -> List[int]:
    try:
        values = [int(part.strip()) for part in array.split(",") if part.strip() != ""]
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="array must be a comma-separated list of integers, e.g. 5,3,8,1",
        ) from exc
    return values


def _resolve_input(
    array: Optional[List[int]] = None,
    size: Optional[int] = None,
) -> List[int]:
    if array is not None:
        _validate_array(array)
        return array
    return _random_array(size if size is not None else DEFAULT_SIZE)


def _public(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in raw.items() if not k.startswith("_")}


def _build_sort_step(index: int, raw: Dict[str, Any]) -> TraceStep:
    public = _public(raw)
    return TraceStep(
        step=index,
        array=public["array"],
        highlights=[Highlight(**h) for h in public.get("highlights", [])],
        message=public["message"],
        comparisons=public.get("comparisons", 0),
        swaps=public.get("swaps", 0),
    )


def _build_graph_step(index: int, raw: Dict[str, Any]) -> GraphTraceStep:
    public = _public(raw)
    return GraphTraceStep(
        step=index,
        grid=[[GridNode(**node) for node in row] for row in public["grid"]],
        message=public["message"],
        visited_count=public.get("visited_count", 0),
        frontier_count=public.get("frontier_count", 0),
    )


def _build_trace(algorithm: str, values: List[int]) -> TraceResponse:
    trace_fn = get_trace_fn(algorithm)
    steps = [_build_sort_step(index, raw) for index, raw in enumerate(trace_fn(values))]
    return TraceResponse(
        algorithm=algorithm,
        input=values,
        total_steps=len(steps),
        steps=steps,
    )


def _as_cell(value: Any, label: str) -> Cell:
    if isinstance(value, (list, tuple)) and len(value) == 2:
        return (int(value[0]), int(value[1]))
    raise HTTPException(
        status_code=400,
        detail=f"{label} must be a [row, col] pair.",
    )


def _validate_graph(
    rows: int,
    cols: int,
    start: Cell,
    end: Cell,
    walls: List[Cell],
) -> Tuple[int, int, Cell, Cell, List[Cell]]:
    if not MIN_GRID <= rows <= MAX_GRID or not MIN_GRID <= cols <= MAX_GRID:
        raise HTTPException(
            status_code=400,
            detail=f"Grid size must be between {MIN_GRID}×{MIN_GRID} and {MAX_GRID}×{MAX_GRID}.",
        )
    for label, cell in (("start", start), ("end", end)):
        r, c = cell
        if not (0 <= r < rows and 0 <= c < cols):
            raise HTTPException(
                status_code=400,
                detail=f"{label} {cell} is outside the {rows}×{cols} grid.",
            )
    if start == end:
        raise HTTPException(
            status_code=400,
            detail="start and end must be different cells.",
        )

    seen: Set[Cell] = set()
    unique_walls: List[Cell] = []
    for wall in walls:
        cell = _as_cell(wall, "wall")
        wr, wc = cell
        if not (0 <= wr < rows and 0 <= wc < cols):
            raise HTTPException(
                status_code=400,
                detail=f"Wall {cell} is outside the {rows}×{cols} grid.",
            )
        if cell == start or cell == end:
            raise HTTPException(
                status_code=400,
                detail="Walls must not include the start or end cell.",
            )
        if cell not in seen:
            seen.add(cell)
            unique_walls.append(cell)
    return rows, cols, start, end, unique_walls


def _build_graph_trace(
    algorithm: str,
    rows: int,
    cols: int,
    start: Cell,
    end: Cell,
    walls: List[Cell],
) -> GraphTraceResponse:
    rows, cols, start, end, walls = _validate_graph(rows, cols, start, end, walls)
    trace_fn = get_trace_fn(algorithm)
    steps = [
        _build_graph_step(index, raw)
        for index, raw in enumerate(trace_fn(rows, cols, start, end, walls))
    ]
    return GraphTraceResponse(
        algorithm=algorithm,
        rows=rows,
        cols=cols,
        start=start,
        end=end,
        walls=walls,
        total_steps=len(steps),
        steps=steps,
    )


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/algorithms", response_model=List[AlgorithmInfo])
def list_algorithms() -> List[AlgorithmInfo]:
    return [
        AlgorithmInfo(
            id=algorithm_id,
            name=meta["name"],
            category=meta["category"],
            description=meta["description"],
        )
        for algorithm_id, meta in ALGORITHM_REGISTRY.items()
    ]


@app.get("/api/trace/{algorithm}", response_model=TraceResponse)
def get_trace(
    algorithm: str,
    array: Optional[str] = Query(
        default=None,
        description="Comma-separated integers, e.g. 5,3,8,1",
    ),
    size: Optional[int] = Query(
        default=None,
        description="Generate a random array of this length when `array` is omitted",
    ),
) -> TraceResponse:
    _require_category(algorithm, "sorting")
    values = _resolve_input(
        array=_parse_array_query(array) if array is not None else None,
        size=size,
    )
    return _build_trace(algorithm, values)


@app.post("/api/trace/{algorithm}", response_model=TraceResponse)
def post_trace(algorithm: str, body: TraceRequest) -> TraceResponse:
    _require_category(algorithm, "sorting")
    values = _resolve_input(array=body.array, size=body.size)
    return _build_trace(algorithm, values)


# Parallel path instead of overloading POST /api/trace: FastAPI/OpenAPI would
# otherwise have to describe two unrelated bodies on one route, and v1 clients
# that POST a TraceRequest keep working unchanged.
@app.post("/api/graph-trace/{algorithm}", response_model=GraphTraceResponse)
def post_graph_trace(algorithm: str, body: GraphTraceRequest) -> GraphTraceResponse:
    _require_category(algorithm, "graph")
    return _build_graph_trace(
        algorithm,
        body.rows,
        body.cols,
        _as_cell(body.start, "start"),
        _as_cell(body.end, "end"),
        list(body.walls),
    )


@app.websocket("/ws/trace/{algorithm}")
async def ws_trace(websocket: WebSocket, algorithm: str) -> None:
    """Stream generator yields one step at a time.

    Client sends one JSON message first — TraceRequest for sorting, or
    GraphTraceRequest for graph — then receives:
      {type: "meta", ...header fields, category}
      {type: "step", data: TraceStep | GraphTraceStep}  (repeated)
      {type: "done", total_steps: int}
    Errors are {type: "error", detail: str}.
    """
    await websocket.accept()
    try:
        if algorithm not in ALGORITHM_REGISTRY:
            await websocket.send_json(
                {
                    "type": "error",
                    "detail": (
                        f"Unknown algorithm '{algorithm}'. "
                        f"Available: {', '.join(_available_ids())}"
                    ),
                }
            )
            await websocket.close(code=1008)
            return

        params = await websocket.receive_json()
        category = get_category(algorithm)

        if category == "sorting":
            body = TraceRequest.model_validate(params)
            values = _resolve_input(array=body.array, size=body.size)
            await websocket.send_json(
                {
                    "type": "meta",
                    "category": "sorting",
                    "algorithm": algorithm,
                    "input": values,
                }
            )
            total = 0
            for index, raw in enumerate(get_trace_fn(algorithm)(values)):
                step = _build_sort_step(index, raw)
                await websocket.send_json(
                    {"type": "step", "data": step.model_dump(mode="json")}
                )
                total = index + 1
                await asyncio.sleep(0)
            await websocket.send_json({"type": "done", "total_steps": total})
            return

        body = GraphTraceRequest.model_validate(params)
        rows, cols, start, end, walls = _validate_graph(
            body.rows,
            body.cols,
            _as_cell(body.start, "start"),
            _as_cell(body.end, "end"),
            list(body.walls),
        )
        await websocket.send_json(
            {
                "type": "meta",
                "category": "graph",
                "algorithm": algorithm,
                "rows": rows,
                "cols": cols,
                "start": list(start),
                "end": list(end),
                "walls": [list(w) for w in walls],
            }
        )
        total = 0
        for index, raw in enumerate(get_trace_fn(algorithm)(rows, cols, start, end, walls)):
            step = _build_graph_step(index, raw)
            await websocket.send_json(
                {"type": "step", "data": step.model_dump(mode="json")}
            )
            total = index + 1
            await asyncio.sleep(0)
        await websocket.send_json({"type": "done", "total_steps": total})
    except WebSocketDisconnect:
        return
    except HTTPException as exc:
        await websocket.send_json({"type": "error", "detail": exc.detail})
        await websocket.close(code=1008)
    except ValidationError as exc:
        await websocket.send_json(
            {"type": "error", "detail": "; ".join(err["msg"] for err in exc.errors())}
        )
        await websocket.close(code=1008)
    except Exception as exc:  # noqa: BLE001 — last-resort WS error channel
        await websocket.send_json({"type": "error", "detail": str(exc)})
        await websocket.close(code=1011)
