"""Shared grid helpers for pathfinding traces.

BFS / DFS / Dijkstra all walk a 4-neighbor grid and yield the same
snapshot shape. Keeping snapshot construction here means the algorithms
only have to worry about their frontier (queue vs stack vs heap).
"""

from typing import Dict, Iterable, List, Optional, Set, Tuple

Cell = Tuple[int, int]

# Up, right, down, left — a stable order so traces are deterministic.
DIRECTIONS: Tuple[Cell, ...] = ((-1, 0), (0, 1), (1, 0), (0, -1))


def in_bounds(row: int, col: int, rows: int, cols: int) -> bool:
    return 0 <= row < rows and 0 <= col < cols


def neighbors(
    cell: Cell,
    rows: int,
    cols: int,
    walls: Set[Cell],
) -> Iterable[Cell]:
    row, col = cell
    for dr, dc in DIRECTIONS:
        nxt = (row + dr, col + dc)
        if in_bounds(nxt[0], nxt[1], rows, cols) and nxt not in walls:
            yield nxt


def reconstruct_path(parent: Dict[Cell, Cell], start: Cell, end: Cell) -> List[Cell]:
    """Walk parent pointers from `end` back to `start`. Includes both ends."""
    path: List[Cell] = [end]
    current = end
    while current != start:
        current = parent[current]
        path.append(current)
    path.reverse()
    return path


def snapshot(
    rows: int,
    cols: int,
    start: Cell,
    end: Cell,
    walls: Set[Cell],
    frontier: Set[Cell],
    visited: Set[Cell],
    current: Optional[Cell],
    path: Optional[Set[Cell]] = None,
    distances: Optional[Dict[Cell, float]] = None,
) -> List[List[Dict]]:
    """Build one full-grid frame.

    Priority (highest first): wall, current, path, start, end, frontier, visited.
    Start/end stay identifiable during the search; the reconstructed path
    paints over intermediate cells in yellow on the frontend.
    """
    path = path or set()
    distances = distances or {}
    grid: List[List[Dict]] = []
    for r in range(rows):
        row_nodes: List[Dict] = []
        for c in range(cols):
            cell = (r, c)
            if cell in walls:
                state = "wall"
            elif current is not None and cell == current:
                state = "current"
            elif cell in path and cell != start and cell != end:
                state = "path"
            elif cell == start:
                state = "start"
            elif cell == end:
                state = "end"
            elif cell in frontier:
                state = "frontier"
            elif cell in visited:
                state = "visited"
            else:
                state = "unvisited"

            node: Dict = {"row": r, "col": c, "state": state}
            if cell in distances:
                node["distance"] = distances[cell]
            row_nodes.append(node)
        grid.append(row_nodes)
    return grid
