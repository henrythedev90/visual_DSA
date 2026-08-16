"""Dijkstra's algorithm on a grid.

Every edge costs 1 here (4-neighbor grid), so the *numeric* answer matches
BFS — the point of this visualizer is the *mechanism*: a min-heap ordered
by running distance, and a `distance` field on every settled node.

If we later add weighted cells, only the cost in `nd = d + 1` has to change.
"""

import heapq
from typing import Dict, Iterator, List, Set, Tuple

from app.algorithms.grid import neighbors, reconstruct_path, snapshot

Cell = Tuple[int, int]


def trace_dijkstra(
    rows: int,
    cols: int,
    start: Cell,
    end: Cell,
    walls: List[Cell],
) -> Iterator[Dict]:
    wall_set: Set[Cell] = set(walls)
    dist: Dict[Cell, float] = {start: 0.0}
    parent: Dict[Cell, Cell] = {}
    visited: Set[Cell] = set()
    frontier: Set[Cell] = {start}
    # (distance, tie_breaker, row, col) — the counter keeps heapq from
    # comparing cells when distances are equal (cells aren't ordered).
    heap: List[Tuple[float, int, int, int]] = [(0.0, 0, start[0], start[1])]
    counter = 0

    yield {
        "grid": snapshot(
            rows, cols, start, end, wall_set, frontier, visited, None, distances=dist
        ),
        "message": f"Dijkstra from {start} to {end} — frontier is a min-heap on distance",
        "focus": "init",
        "visited_count": 0,
        "frontier_count": 1,
    }

    while heap:
        d, _, r, c = heapq.heappop(heap)
        current = (r, c)
        if current in visited:
            continue
        frontier.discard(current)

        yield {
            "grid": snapshot(
                rows,
                cols,
                start,
                end,
                wall_set,
                frontier,
                visited,
                current,
                distances=dist,
            ),
            "message": f"Settling {current} at distance {int(d)}",
            "focus": "settle",
            "visited_count": len(visited),
            "frontier_count": len(frontier),
        }

        if current == end:
            path = reconstruct_path(parent, start, end)
            painted: Set[Cell] = set()
            for cell in path:
                painted.add(cell)
                yield {
                    "grid": snapshot(
                        rows,
                        cols,
                        start,
                        end,
                        wall_set,
                        frontier,
                        visited,
                        None,
                        path=painted,
                        distances=dist,
                    ),
                    "message": f"Path cell {cell} ({len(painted)} / {len(path)})",
                    "focus": "path",
                    "visited_count": len(visited) + 1,
                    "frontier_count": len(frontier),
                }
            yield {
                "grid": snapshot(
                    rows,
                    cols,
                    start,
                    end,
                    wall_set,
                    frontier,
                    visited | {current},
                    None,
                    path=set(path),
                    distances=dist,
                ),
                "message": f"Dijkstra found a shortest path of cost {int(d)}",
                "focus": "found",
                "visited_count": len(visited) + 1,
                "frontier_count": 0,
            }
            return

        visited.add(current)

        for nxt in neighbors(current, rows, cols, wall_set):
            if nxt in visited:
                continue
            nd = d + 1
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd
                parent[nxt] = current
                counter += 1
                heapq.heappush(heap, (nd, counter, nxt[0], nxt[1]))
                frontier.add(nxt)
                yield {
                    "grid": snapshot(
                        rows,
                        cols,
                        start,
                        end,
                        wall_set,
                        frontier,
                        visited,
                        current,
                        distances=dist,
                    ),
                    "message": f"Relaxed {nxt} to distance {int(nd)} (via {current})",
                    "focus": "relax",
                    "visited_count": len(visited),
                    "frontier_count": len(frontier),
                }

    yield {
        "grid": snapshot(
            rows, cols, start, end, wall_set, frontier, visited, None, distances=dist
        ),
        "message": "Dijkstra exhausted the grid — no path exists",
        "focus": "none",
        "visited_count": len(visited),
        "frontier_count": 0,
    }
