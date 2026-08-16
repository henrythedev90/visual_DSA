"""DFS (depth-first search) on a grid.

Same neighbor rules as BFS, but the frontier is a stack (LIFO). DFS is
not guaranteed to find a shortest path — it walks one corridor as far as
it can before backtracking. The reconstructed path is simply "the path
we took to first reach the end."
"""

from typing import Dict, Iterator, List, Set, Tuple

from app.algorithms.grid import neighbors, reconstruct_path, snapshot

Cell = Tuple[int, int]


def trace_dfs(
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
    stack: List[Cell] = [start]

    yield {
        "grid": snapshot(rows, cols, start, end, wall_set, frontier, visited, None),
        "message": f"DFS from {start} to {end} — frontier is a stack",
        "focus": "init",
        "visited_count": 0,
        "frontier_count": 1,
    }

    while stack:
        current = stack.pop()
        frontier.discard(current)

        if current in visited:
            continue

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
                "message": (
                    f"DFS found a path of {len(path) - 1} steps "
                    "(not necessarily shortest)"
                ),
                "focus": "found",
                "visited_count": len(visited) + 1,
                "frontier_count": 0,
            }
            return

        visited.add(current)

        # Reverse so the first neighbor (up) is popped first — a stable,
        # interview-friendly exploration order.
        for nxt in reversed(list(neighbors(current, rows, cols, wall_set))):
            if nxt in visited or nxt in frontier:
                continue
            parent[nxt] = current
            stack.append(nxt)
            frontier.add(nxt)
            yield {
                "grid": snapshot(
                    rows, cols, start, end, wall_set, frontier, visited, current
                ),
                "message": f"Pushed {nxt} onto the stack (from {current})",
                "focus": "push",
                "visited_count": len(visited),
                "frontier_count": len(frontier),
            }

    yield {
        "grid": snapshot(rows, cols, start, end, wall_set, frontier, visited, None),
        "message": "DFS exhausted the grid — no path exists",
        "focus": "none",
        "visited_count": len(visited),
        "frontier_count": 0,
    }
