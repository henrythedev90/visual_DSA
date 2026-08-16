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
