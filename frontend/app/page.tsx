"use client";

import { useCallback, useEffect, useMemo, useRef, useReducer } from "react";

import { AlgorithmPicker } from "@/components/AlgorithmPicker";
import { ArrayInput } from "@/components/ArrayInput";
import { BarChart } from "@/components/BarChart";
import { CodePanel } from "@/components/CodePanel";
import { ComplexityBadge } from "@/components/ComplexityBadge";
import { GridEditor } from "@/components/GridEditor";
import { GridVisualizer } from "@/components/GridVisualizer";
import { PlaybackControls } from "@/components/PlaybackControls";
import { ThemeControls } from "@/components/ThemeControls";
import {
  API_BASE,
  cellsEqual,
  fetchAlgorithms,
  fetchGraphTrace,
  fetchTrace,
  generateRandomArray,
  parseArrayInput,
  scatterWalls,
  streamTrace,
} from "@/lib/api";
import type {
  AlgorithmInfo,
  Cell,
  GraphTraceResponse,
  GraphTraceStep,
  GridNode,
  NodeState,
  PaintMode,
  TraceResponse,
  TraceStep,
} from "@/lib/types";

const DEFAULT_SIZE = 12;
const DEFAULT_SPEED_MS = 280;
const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 20;
const DEFAULT_START: Cell = [7, 1];
const DEFAULT_END: Cell = [7, 18];
const IS_PRODUCTION = process.env.NODE_ENV === "production";

interface VisualizerState {
  algorithms: AlgorithmInfo[];
  algorithmId: string;
  arrayText: string;
  size: number;
  trace: TraceResponse | null;
  graphTrace: GraphTraceResponse | null;
  rows: number;
  cols: number;
  start: Cell;
  end: Cell;
  walls: Cell[];
  paintMode: PaintMode;
  transport: "rest" | "ws";
  streaming: boolean;
  stepIndex: number;
  playing: boolean;
  speedMs: number;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_ALGORITHMS"; algorithms: AlgorithmInfo[] }
  | { type: "SELECT_ALGORITHM"; id: string }
  | { type: "SET_ARRAY_TEXT"; text: string }
  | { type: "SET_SIZE"; size: number }
  | { type: "SET_TRANSPORT"; transport: "rest" | "ws" }
  | { type: "SET_PAINT_MODE"; mode: PaintMode }
  | { type: "SET_GRID_SIZE"; rows: number; cols: number }
  | { type: "SET_START"; cell: Cell }
  | { type: "SET_END"; cell: Cell }
  | { type: "SET_WALLS"; walls: Cell[] }
  | { type: "PAINT_WALL"; row: number; col: number; op: "add" | "remove" }
  | { type: "TRACE_LOADING" }
  | { type: "TRACE_SUCCESS"; trace: TraceResponse }
  | { type: "GRAPH_TRACE_SUCCESS"; trace: GraphTraceResponse }
  | { type: "STREAM_SORT_META"; algorithm: string; input: number[] }
  | { type: "STREAM_GRAPH_META"; meta: GraphTraceResponse }
  | { type: "STREAM_SORT_STEP"; step: TraceStep }
  | { type: "STREAM_GRAPH_STEP"; step: GraphTraceStep }
  | { type: "STREAM_DONE"; totalSteps: number }
  | { type: "TRACE_ERROR"; error: string }
  | { type: "SET_STEP"; index: number }
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACK" }
  | { type: "TOGGLE_PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_SPEED"; speedMs: number };

const initialState: VisualizerState = {
  algorithms: [],
  algorithmId: "",
  arrayText: "",
  size: DEFAULT_SIZE,
  trace: null,
  graphTrace: null,
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  start: DEFAULT_START,
  end: DEFAULT_END,
  walls: [],
  paintMode: "wall",
  transport: "rest",
  streaming: false,
  stepIndex: 0,
  playing: false,
  speedMs: DEFAULT_SPEED_MS,
  loading: true,
  error: null,
};

function categoryOf(state: VisualizerState): "sorting" | "graph" | null {
  const alg = state.algorithms.find((item) => item.id === state.algorithmId);
  if (alg?.category === "graph" || alg?.category === "sorting")
    return alg.category;
  return null;
}

function activeLength(state: VisualizerState): number {
  if (categoryOf(state) === "graph") return state.graphTrace?.total_steps ?? 0;
  return state.trace?.total_steps ?? 0;
}

function lastIndex(state: VisualizerState): number {
  const total = activeLength(state);
  return total === 0 ? 0 : total - 1;
}

function clampCell(cell: Cell, rows: number, cols: number): Cell {
  return [
    Math.max(0, Math.min(rows - 1, cell[0])),
    Math.max(0, Math.min(cols - 1, cell[1])),
  ];
}

function resizeGrid(
  state: VisualizerState,
  rows: number,
  cols: number,
): VisualizerState {
  let start = clampCell(state.start, rows, cols);
  let end = clampCell(state.end, rows, cols);
  if (cellsEqual(start, end)) {
    end = [rows - 1, cols - 1];
    if (cellsEqual(start, end)) start = [0, 0];
  }
  const walls = state.walls.filter(
    ([r, c]) =>
      r < rows &&
      c < cols &&
      !cellsEqual([r, c], start) &&
      !cellsEqual([r, c], end),
  );
  return { ...state, rows, cols, start, end, walls };
}

function reducer(state: VisualizerState, action: Action): VisualizerState {
  switch (action.type) {
    case "SET_ALGORITHMS":
      return {
        ...state,
        algorithms: action.algorithms,
        algorithmId: state.algorithmId || action.algorithms[0]?.id || "",
      };
    case "SELECT_ALGORITHM":
      return { ...state, algorithmId: action.id, playing: false };
    case "SET_ARRAY_TEXT":
      return { ...state, arrayText: action.text };
    case "SET_SIZE":
      return { ...state, size: action.size };
    case "SET_TRANSPORT":
      return { ...state, transport: action.transport };
    case "SET_PAINT_MODE":
      return { ...state, paintMode: action.mode };
    case "SET_GRID_SIZE":
      return resizeGrid(state, action.rows, action.cols);
    case "SET_START":
      if (cellsEqual(action.cell, state.end)) return state;
      return {
        ...state,
        start: action.cell,
        walls: state.walls.filter((wall) => !cellsEqual(wall, action.cell)),
      };
    case "SET_END":
      if (cellsEqual(action.cell, state.start)) return state;
      return {
        ...state,
        end: action.cell,
        walls: state.walls.filter((wall) => !cellsEqual(wall, action.cell)),
      };
    case "SET_WALLS":
      return { ...state, walls: action.walls };
    case "PAINT_WALL": {
      const cell: Cell = [action.row, action.col];
      if (cellsEqual(cell, state.start) || cellsEqual(cell, state.end))
        return state;
      const exists = state.walls.some((wall) => cellsEqual(wall, cell));
      if (action.op === "add" && !exists) {
        return { ...state, walls: [...state.walls, cell] };
      }
      if (action.op === "remove" && exists) {
        return {
          ...state,
          walls: state.walls.filter((wall) => !cellsEqual(wall, cell)),
        };
      }
      return state;
    }
    case "TRACE_LOADING":
      return {
        ...state,
        loading: true,
        streaming: false,
        error: null,
        playing: false,
      };
    case "TRACE_SUCCESS":
      return {
        ...state,
        loading: false,
        streaming: false,
        error: null,
        trace: action.trace,
        graphTrace: null,
        stepIndex: 0,
        playing: false,
        arrayText: action.trace.input.join(", "),
      };
    case "GRAPH_TRACE_SUCCESS":
      return {
        ...state,
        loading: false,
        streaming: false,
        error: null,
        graphTrace: action.trace,
        trace: null,
        stepIndex: 0,
        playing: false,
      };
    case "STREAM_SORT_META":
      return {
        ...state,
        loading: false,
        streaming: true,
        error: null,
        graphTrace: null,
        trace: {
          algorithm: action.algorithm,
          input: action.input,
          total_steps: 0,
          steps: [],
        },
        stepIndex: 0,
        arrayText: action.input.join(", "),
      };
    case "STREAM_GRAPH_META":
      return {
        ...state,
        loading: false,
        streaming: true,
        error: null,
        trace: null,
        graphTrace: { ...action.meta, total_steps: 0, steps: [] },
        stepIndex: 0,
      };
    case "STREAM_SORT_STEP": {
      if (!state.trace) return state;
      const steps = [...state.trace.steps, action.step];
      return {
        ...state,
        trace: { ...state.trace, steps, total_steps: steps.length },
      };
    }
    case "STREAM_GRAPH_STEP": {
      if (!state.graphTrace) return state;
      const steps = [...state.graphTrace.steps, action.step];
      return {
        ...state,
        graphTrace: { ...state.graphTrace, steps, total_steps: steps.length },
      };
    }
    case "STREAM_DONE":
      return {
        ...state,
        loading: false,
        streaming: false,
        trace: state.trace
          ? { ...state.trace, total_steps: action.totalSteps }
          : state.trace,
        graphTrace: state.graphTrace
          ? { ...state.graphTrace, total_steps: action.totalSteps }
          : state.graphTrace,
      };
    case "TRACE_ERROR":
      return {
        ...state,
        loading: false,
        streaming: false,
        error: action.error,
        playing: false,
      };
    case "SET_STEP":
      return { ...state, stepIndex: action.index, playing: false };
    case "STEP_FORWARD": {
      const next = Math.min(state.stepIndex + 1, lastIndex(state));
      const atEnd = next >= lastIndex(state) && !state.streaming;
      return {
        ...state,
        stepIndex: next,
        playing: atEnd ? false : state.playing,
      };
    }
    case "STEP_BACK":
      return {
        ...state,
        stepIndex: Math.max(state.stepIndex - 1, 0),
        playing: false,
      };
    case "TOGGLE_PLAY": {
      if (activeLength(state) === 0) return state;
      if (state.stepIndex >= lastIndex(state) && !state.streaming) {
        return { ...state, stepIndex: 0, playing: true };
      }
      return { ...state, playing: !state.playing };
    }
    case "PAUSE":
      return { ...state, playing: false };
    case "SET_SPEED":
      return { ...state, speedMs: action.speedMs };
    default:
      return state;
  }
}

function previewGrid(
  rows: number,
  cols: number,
  start: Cell,
  end: Cell,
  walls: Cell[],
): GridNode[][] {
  const wallKeys = new Set(walls.map(([r, c]) => `${r},${c}`));
  const nodes: GridNode[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const row: GridNode[] = [];
    for (let c = 0; c < cols; c += 1) {
      let state: NodeState = "unvisited";
      if (wallKeys.has(`${r},${c}`)) state = "wall";
      if (r === start[0] && c === start[1]) state = "start";
      if (r === end[0] && c === end[1]) state = "end";
      row.push({ row: r, col: c, state });
    }
    nodes.push(row);
  }
  return nodes;
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stopStreamRef = useRef<(() => void) | null>(null);
  const dragRef = useRef<"add" | "remove" | null>(null);
  const category = categoryOf(state);
  const isGraph = category === "graph";

  const stopStream = useCallback(() => {
    stopStreamRef.current?.();
    stopStreamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  useEffect(() => {
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const loadSortTrace = useCallback(
    async (algorithmId: string, values: number[], useWs: boolean) => {
      stopStream();
      dispatch({ type: "TRACE_LOADING" });
      if (useWs) {
        stopStreamRef.current = streamTrace(
          algorithmId,
          { array: values },
          {
            onMeta: (meta) =>
              dispatch({
                type: "STREAM_SORT_META",
                algorithm: meta.algorithm,
                input: meta.input ?? values,
              }),
            onStep: (step) =>
              dispatch({ type: "STREAM_SORT_STEP", step: step as TraceStep }),
            onDone: (totalSteps) =>
              dispatch({ type: "STREAM_DONE", totalSteps }),
            onError: (error) => dispatch({ type: "TRACE_ERROR", error }),
          },
        );
        return;
      }
      try {
        const trace = await fetchTrace(algorithmId, values);
        dispatch({ type: "TRACE_SUCCESS", trace });
      } catch (err) {
        dispatch({
          type: "TRACE_ERROR",
          error: err instanceof Error ? err.message : "Failed to load trace",
        });
      }
    },
    [stopStream],
  );

  const loadGraphTrace = useCallback(
    async (
      algorithmId: string,
      grid: {
        rows: number;
        cols: number;
        start: Cell;
        end: Cell;
        walls: Cell[];
      },
      useWs: boolean,
    ) => {
      stopStream();
      dispatch({ type: "TRACE_LOADING" });
      const payload = {
        rows: grid.rows,
        cols: grid.cols,
        start: grid.start,
        end: grid.end,
        walls: grid.walls,
      };
      if (useWs) {
        stopStreamRef.current = streamTrace(algorithmId, payload, {
          onMeta: (meta) =>
            dispatch({
              type: "STREAM_GRAPH_META",
              meta: {
                algorithm: meta.algorithm,
                rows: meta.rows ?? payload.rows,
                cols: meta.cols ?? payload.cols,
                start: meta.start ?? payload.start,
                end: meta.end ?? payload.end,
                walls: meta.walls ?? payload.walls,
                total_steps: 0,
                steps: [],
              },
            }),
          onStep: (step) =>
            dispatch({
              type: "STREAM_GRAPH_STEP",
              step: step as GraphTraceStep,
            }),
          onDone: (totalSteps) => dispatch({ type: "STREAM_DONE", totalSteps }),
          onError: (error) => dispatch({ type: "TRACE_ERROR", error }),
        });
        return;
      }
      try {
        const trace = await fetchGraphTrace(algorithmId, payload);
        dispatch({ type: "GRAPH_TRACE_SUCCESS", trace });
      } catch (err) {
        dispatch({
          type: "TRACE_ERROR",
          error:
            err instanceof Error ? err.message : "Failed to load graph trace",
        });
      }
    },
    [stopStream],
  );

  const runCurrentArray = useCallback(
    (algorithmId: string, text: string, useWs: boolean) => {
      const parsed = parseArrayInput(text);
      if ("error" in parsed) {
        dispatch({ type: "TRACE_ERROR", error: parsed.error });
        return;
      }
      void loadSortTrace(algorithmId, parsed.values, useWs);
    },
    [loadSortTrace],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const algorithms = await fetchAlgorithms();
        if (cancelled) return;
        dispatch({ type: "SET_ALGORITHMS", algorithms });
        const values = generateRandomArray(DEFAULT_SIZE);
        const firstId = algorithms[0]?.id;
        if (!firstId) {
          dispatch({ type: "TRACE_ERROR", error: "No algorithms registered." });
          return;
        }
        await loadSortTrace(firstId, values, false);
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: "TRACE_ERROR",
            error:
              err instanceof Error ? err.message : "Failed to load algorithms",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSortTrace]);

  const sortSteps = state.trace?.total_steps ?? 0;
  const graphSteps = state.graphTrace?.total_steps ?? 0;

  useEffect(() => {
    if (!state.playing) return;
    if (sortSteps + graphSteps === 0) return;
    const end =
      (isGraph ? graphSteps : sortSteps) === 0
        ? 0
        : (isGraph ? graphSteps : sortSteps) - 1;
    if (state.stepIndex >= end) {
      if (!state.streaming) dispatch({ type: "PAUSE" });
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: "STEP_FORWARD" });
    }, state.speedMs);
    return () => window.clearTimeout(timer);
  }, [
    state.playing,
    state.stepIndex,
    state.speedMs,
    state.streaming,
    sortSteps,
    graphSteps,
    isGraph,
  ]);

  const currentSortStep = state.trace?.steps[state.stepIndex] ?? null;
  const currentGraphStep = state.graphTrace?.steps[state.stepIndex] ?? null;
  const resetKey = state.trace
    ? `${state.trace.algorithm}:${state.trace.input.join(",")}`
    : "empty";

  const editorGrid = useMemo(
    () =>
      previewGrid(state.rows, state.cols, state.start, state.end, state.walls),
    [state.rows, state.cols, state.start, state.end, state.walls],
  );
  const displayGrid = currentGraphStep?.grid ?? editorGrid;

  const caption = isGraph
    ? (currentGraphStep?.message ?? "Paint walls, then visualize.")
    : (currentSortStep?.message ?? "—");

  const handleSelect = (id: string) => {
    dispatch({ type: "SELECT_ALGORITHM", id });
    const alg = state.algorithms.find((item) => item.id === id);
    if (alg?.category === "graph") {
      void loadGraphTrace(
        id,
        {
          rows: state.rows,
          cols: state.cols,
          start: state.start,
          end: state.end,
          walls: state.walls,
        },
        state.transport === "ws",
      );
      return;
    }
    runCurrentArray(id, state.arrayText, state.transport === "ws");
  };

  const handleCellDown = (row: number, col: number) => {
    if (state.paintMode === "start") {
      dispatch({ type: "SET_START", cell: [row, col] });
      return;
    }
    if (state.paintMode === "end") {
      dispatch({ type: "SET_END", cell: [row, col] });
      return;
    }
    const isWall = state.walls.some((wall) => cellsEqual(wall, [row, col]));
    const op = isWall ? "remove" : "add";
    dragRef.current = op;
    dispatch({ type: "PAINT_WALL", row, col, op });
  };

  const handleCellEnter = (row: number, col: number) => {
    if (!dragRef.current || state.paintMode !== "wall") return;
    dispatch({ type: "PAINT_WALL", row, col, op: dragRef.current });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Sorting & pathfinding
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            DSA Visualizer
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Created by Henry Nuñez
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <ThemeControls />
          {!IS_PRODUCTION ? (
            <p className="font-mono text-[11px] text-muted">API {API_BASE}</p>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <AlgorithmPicker
              algorithms={state.algorithms}
              selectedId={state.algorithmId}
              disabled={state.loading && !state.streaming}
              onSelect={handleSelect}
            />
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ComplexityBadge algorithmId={state.algorithmId} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="accent-gold"
                checked={state.transport === "ws"}
                onChange={(event) =>
                  dispatch({
                    type: "SET_TRANSPORT",
                    transport: event.target.checked ? "ws" : "rest",
                  })
                }
              />
              Stream over WebSocket
            </label>
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-5">
          {isGraph ? (
            <GridEditor
              rows={state.rows}
              cols={state.cols}
              paintMode={state.paintMode}
              disabled={state.loading && !state.streaming}
              onRowsChange={(rows) =>
                dispatch({ type: "SET_GRID_SIZE", rows, cols: state.cols })
              }
              onColsChange={(cols) =>
                dispatch({ type: "SET_GRID_SIZE", rows: state.rows, cols })
              }
              onPaintModeChange={(mode) =>
                dispatch({ type: "SET_PAINT_MODE", mode })
              }
              onScatter={() =>
                dispatch({
                  type: "SET_WALLS",
                  walls: scatterWalls(
                    state.rows,
                    state.cols,
                    state.start,
                    state.end,
                  ),
                })
              }
              onClear={() => dispatch({ type: "SET_WALLS", walls: [] })}
              onSubmit={() =>
                void loadGraphTrace(
                  state.algorithmId,
                  {
                    rows: state.rows,
                    cols: state.cols,
                    start: state.start,
                    end: state.end,
                    walls: state.walls,
                  },
                  state.transport === "ws",
                )
              }
            />
          ) : (
            <ArrayInput
              value={state.arrayText}
              size={state.size}
              disabled={state.loading && !state.streaming}
              onChange={(text) => dispatch({ type: "SET_ARRAY_TEXT", text })}
              onSizeChange={(size) => dispatch({ type: "SET_SIZE", size })}
              onRandomize={() => {
                const values = generateRandomArray(state.size);
                dispatch({ type: "SET_ARRAY_TEXT", text: values.join(", ") });
                if (state.algorithmId) {
                  void loadSortTrace(
                    state.algorithmId,
                    values,
                    state.transport === "ws",
                  );
                }
              }}
              onSubmit={() =>
                runCurrentArray(
                  state.algorithmId,
                  state.arrayText,
                  state.transport === "ws",
                )
              }
            />
          )}
        </div>
      </section>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-swapping/40 bg-swapping/10 px-4 py-3 text-sm text-ink"
        >
          {state.error}
        </p>
      ) : null}

      <section className="flex flex-1 flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="min-h-10 max-w-3xl text-base leading-snug text-ink sm:text-lg">
            {state.loading && !state.streaming ? "Computing trace…" : caption}
            {state.streaming ? (
              <span className="ml-2 font-mono text-xs text-muted">live</span>
            ) : null}
          </p>
          <dl className="flex gap-6 font-mono text-sm">
            {isGraph ? (
              <>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Visited
                  </dt>
                  <dd className="text-lg text-gold">
                    {currentGraphStep?.visited_count ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Frontier
                  </dt>
                  <dd className="text-lg text-gold">
                    {currentGraphStep?.frontier_count ?? 0}
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Comparisons
                  </dt>
                  <dd className="text-lg text-gold">
                    {currentSortStep?.comparisons ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Swaps
                  </dt>
                  <dd className="text-lg text-gold">
                    {currentSortStep?.swaps ?? 0}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <div className="min-w-0">
            {isGraph ? (
              <GridVisualizer
                grid={displayGrid}
                interactive={!state.playing}
                showDistances={
                  state.algorithmId === "dijkstra" && state.cols <= 24
                }
                onCellPointerDown={handleCellDown}
                onCellPointerEnter={handleCellEnter}
              />
            ) : (
              <BarChart key={resetKey} step={currentSortStep} />
            )}
          </div>
          <div className="min-h-56 min-w-0 lg:min-h-0">
            <CodePanel
              algorithmId={state.algorithmId}
              focus={
                isGraph
                  ? (currentGraphStep?.focus ?? "")
                  : (currentSortStep?.focus ?? "")
              }
            />
          </div>
        </div>

        <PlaybackControls
          stepIndex={state.stepIndex}
          totalSteps={activeLength(state)}
          playing={state.playing}
          speedMs={state.speedMs}
          disabled={activeLength(state) === 0}
          onTogglePlay={() => dispatch({ type: "TOGGLE_PLAY" })}
          onStepBack={() => dispatch({ type: "STEP_BACK" })}
          onStepForward={() => dispatch({ type: "STEP_FORWARD" })}
          onSeek={(index) => dispatch({ type: "SET_STEP", index })}
          onSpeedChange={(ms) => dispatch({ type: "SET_SPEED", speedMs: ms })}
        />
      </section>
    </div>
  );
}
