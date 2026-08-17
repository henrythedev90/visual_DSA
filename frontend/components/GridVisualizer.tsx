"use client";

import { motion } from "framer-motion";

import type { GridNode, NodeState } from "@/lib/types";

const STATE_COLOR: Record<NodeState, string> = {
  unvisited: "var(--cell-unvisited)",
  frontier: "#7dd3fc",
  visited: "#3b82f6",
  current: "#f59e0b",
  path: "var(--gold)",
  wall: "var(--cell-wall)",
  start: "#3ecf8e",
  end: "#e85d4c",
};

const LEGEND: { state: NodeState; label: string }[] = [
  { state: "start", label: "Start" },
  { state: "end", label: "End" },
  { state: "wall", label: "Wall" },
  { state: "frontier", label: "Frontier" },
  { state: "visited", label: "Visited" },
  { state: "current", label: "Current" },
  { state: "path", label: "Path" },
];

interface GridVisualizerProps {
  grid: GridNode[][] | null;
  interactive?: boolean;
  showDistances?: boolean;
  onCellPointerDown?: (row: number, col: number) => void;
  onCellPointerEnter?: (row: number, col: number) => void;
}

export function GridVisualizer({
  grid,
  interactive = false,
  showDistances = false,
  onCellPointerDown,
  onCellPointerEnter,
}: GridVisualizerProps) {
  if (!grid || grid.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Paint a maze, then visualize.
      </div>
    );
  }

  const cols = grid[0]?.length ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid w-full gap-px rounded-lg bg-line p-px touch-none select-none"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onPointerLeave={() => undefined}
      >
        {grid.flatMap((row) =>
          row.map((node) => {
            const dist =
              showDistances &&
              node.distance != null &&
              node.state !== "wall" &&
              node.state !== "unvisited";
            return (
              <motion.button
                key={`${node.row}-${node.col}`}
                type="button"
                disabled={!interactive}
                aria-label={`Cell ${node.row}, ${node.col} ${node.state}`}
                className="aspect-square min-h-0 min-w-0 rounded-xs text-[8px] font-mono leading-none text-canvas/80 disabled:cursor-default"
                initial={false}
                animate={{ backgroundColor: STATE_COLOR[node.state] }}
                transition={{ duration: 0.18 }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  onCellPointerDown?.(node.row, node.col);
                }}
                onPointerEnter={() => onCellPointerEnter?.(node.row, node.col)}
              >
                {dist ? Math.round(node.distance as number) : null}
              </motion.button>
            );
          }),
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {LEGEND.map((item) => (
          <li key={item.state} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: STATE_COLOR[item.state] }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
