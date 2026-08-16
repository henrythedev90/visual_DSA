"""FastAPI routes. Algorithm logic lives in `app.algorithms` — keep it out of here."""

from __future__ import annotations

import random
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.algorithms import ALGORITHM_REGISTRY, get_trace_fn
from app.models import (
    AlgorithmInfo,
    Highlight,
    TraceRequest,
    TraceResponse,
    TraceStep,
)

MIN_SIZE = 2
MAX_SIZE = 100
DEFAULT_SIZE = 15
# Random values are sampled from this inclusive range so bars have visible
# height differences without needing to know the user's input.
RANDOM_VALUE_MIN = 1
RANDOM_VALUE_MAX = 100

app = FastAPI(
    title="DSA Visualizer API",
    description="Step-by-step traces of sorting algorithms for the visualizer UI.",
    version="1.0.0",
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
    # Unique values make bar-identity animation on the frontend unambiguous.
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


def _build_trace(algorithm: str, values: List[int]) -> TraceResponse:
    trace_fn = get_trace_fn(algorithm)
    steps: List[TraceStep] = []
    for index, raw in enumerate(trace_fn(values)):
        # Generators may stash private keys (prefixed with _) for control flow;
        # strip those so they never leak into the API response.
        public = {k: v for k, v in raw.items() if not k.startswith("_")}
        steps.append(
            TraceStep(
                step=index,
                array=public["array"],
                highlights=[Highlight(**h) for h in public.get("highlights", [])],
                message=public["message"],
                comparisons=public.get("comparisons", 0),
                swaps=public.get("swaps", 0),
            )
        )
    return TraceResponse(
        algorithm=algorithm,
        input=values,
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
    _require_algorithm(algorithm)
    values = _resolve_input(
        array=_parse_array_query(array) if array is not None else None,
        size=size,
    )
    return _build_trace(algorithm, values)


@app.post("/api/trace/{algorithm}", response_model=TraceResponse)
def post_trace(algorithm: str, body: TraceRequest) -> TraceResponse:
    _require_algorithm(algorithm)
    values = _resolve_input(array=body.array, size=body.size)
    return _build_trace(algorithm, values)
