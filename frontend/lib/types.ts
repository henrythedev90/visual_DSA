/** Mirrors `backend/app/models.py` — keep the two in sync. */

export type HighlightRole =
  | "comparing"
  | "swapping"
  | "sorted"
  | "pivot"
  | "merging"
  | "active_range";

export interface Highlight {
  index: number;
  role: HighlightRole;
}

export interface TraceStep {
  step: number;
  array: number[];
  highlights: Highlight[];
  message: string;
  comparisons: number;
  swaps: number;
  focus: string;
}

export interface TraceResponse {
  algorithm: string;
  input: number[];
  total_steps: number;
  steps: TraceStep[];
}

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface TraceRequest {
  array?: number[] | null;
  size?: number | null;
}

export type Cell = [number, number];

export type NodeState =
  | "unvisited"
  | "frontier"
  | "visited"
  | "current"
  | "path"
  | "wall"
  | "start"
  | "end";

export interface GridNode {
  row: number;
  col: number;
  state: NodeState;
  distance?: number | null;
}

export interface GraphTraceStep {
  step: number;
  grid: GridNode[][];
  message: string;
  visited_count: number;
  frontier_count: number;
  focus: string;
}

export interface GraphTraceResponse {
  algorithm: string;
  rows: number;
  cols: number;
  start: Cell;
  end: Cell;
  walls: Cell[];
  total_steps: number;
  steps: GraphTraceStep[];
}

export interface GraphTraceRequest {
  rows: number;
  cols: number;
  start: Cell;
  end: Cell;
  walls: Cell[];
}

export type PaintMode = "wall" | "start" | "end";

export interface StreamMeta {
  type: "meta";
  category: "sorting" | "graph";
  algorithm: string;
  input?: number[];
  rows?: number;
  cols?: number;
  start?: Cell;
  end?: Cell;
  walls?: Cell[];
}
