"""BFS (breadth-first search) on a grid.

Unweighted shortest path: the first time we reach the end is the fewest
steps, because every edge costs 1 and we expand level by level.

Frontier = queue (FIFO). Yield when a neighbor is discovered (enters the
queue) and when a node is dequeued for processing.
"""

from collections import deque
from typing import Dict, Iterator, List, Set, Tuple

from app.algorithms.grid import neighbors, reconstruct_path, snapshot

Cell = Tuple[int, int]


def trace_bfs(
    rows: int,
    cols: int,
    start: Cell,
    end: Cell,
    walls: List[Cell],
) -> Iterator[Dict]:
    wall_set: Set[Cell] = set(walls)
    frontier: Set[Cell] = {start}
    visited: Set[Cell] = set()
    parent: Dict[Cell, Cell] = {}
    queue: deque[Cell] = deque([start])

    yield {
        "grid": snapshot(rows, cols, start, end, wall_set, frontier, visited, None),
        "message": f"BFS from {start} to {end} — frontier is a queue",
        "focus": "init",
        "visited_count": 0,
        "frontier_count": 1,
    }

    while queue:
        current = queue.popleft()
        frontier.discard(current)

        yield {
            "grid": snapshot(
                rows, cols, start, end, wall_set, frontier, visited, current
            ),
            "message": f"Visiting {current}",
            "focus": "visit",
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
                ),
                "message": f"BFS found a shortest path of {len(path) - 1} steps",
                "focus": "found",
                "visited_count": len(visited) + 1,
                "frontier_count": 0,
            }
            return

        visited.add(current)

        for nxt in neighbors(current, rows, cols, wall_set):
            if nxt in visited or nxt in frontier:
                continue
            parent[nxt] = current
            queue.append(nxt)
            frontier.add(nxt)
            yield {
                "grid": snapshot(
                    rows, cols, start, end, wall_set, frontier, visited, current
                ),
                "message": f"Queued {nxt} (discovered from {current})",
                "focus": "enqueue",
                "visited_count": len(visited),
                "frontier_count": len(frontier),
            }

    yield {
        "grid": snapshot(rows, cols, start, end, wall_set, frontier, visited, None),
        "message": "BFS exhausted the grid — no path exists",
        "focus": "none",
        "visited_count": len(visited),
        "frontier_count": 0,
    }
