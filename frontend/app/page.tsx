"use client";

import { useCallback, useEffect, useReducer } from "react";

import { AlgorithmPicker } from "@/components/AlgorithmPicker";
import { ArrayInput } from "@/components/ArrayInput";
import { BarChart } from "@/components/BarChart";
import { PlaybackControls } from "@/components/PlaybackControls";
import {
  API_BASE,
  fetchAlgorithms,
  fetchTrace,
  generateRandomArray,
  parseArrayInput,
} from "@/lib/api";
import type { AlgorithmInfo, TraceResponse } from "@/lib/types";

const DEFAULT_SIZE = 12;
const DEFAULT_SPEED_MS = 280;

interface VisualizerState {
  algorithms: AlgorithmInfo[];
  algorithmId: string;
  arrayText: string;
  size: number;
  trace: TraceResponse | null;
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
  | { type: "TRACE_LOADING" }
  | { type: "TRACE_SUCCESS"; trace: TraceResponse }
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
  stepIndex: 0,
  playing: false,
  speedMs: DEFAULT_SPEED_MS,
  loading: true,
  error: null,
};

function lastIndex(trace: TraceResponse | null): number {
  if (!trace || trace.total_steps === 0) return 0;
  return trace.total_steps - 1;
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
    case "TRACE_LOADING":
      return { ...state, loading: true, error: null, playing: false };
    case "TRACE_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        trace: action.trace,
        stepIndex: 0,
        playing: false,
        arrayText: action.trace.input.join(", "),
      };
    case "TRACE_ERROR":
      return { ...state, loading: false, error: action.error, playing: false };
    case "SET_STEP":
      return { ...state, stepIndex: action.index, playing: false };
    case "STEP_FORWARD": {
      const next = Math.min(state.stepIndex + 1, lastIndex(state.trace));
      const atEnd = next >= lastIndex(state.trace);
      return { ...state, stepIndex: next, playing: atEnd ? false : state.playing };
    }
    case "STEP_BACK":
      return {
        ...state,
        stepIndex: Math.max(state.stepIndex - 1, 0),
        playing: false,
      };
    case "TOGGLE_PLAY":
      if (!state.trace) return state;
      if (state.stepIndex >= lastIndex(state.trace)) {
        return { ...state, stepIndex: 0, playing: true };
      }
      return { ...state, playing: !state.playing };
    case "PAUSE":
      return { ...state, playing: false };
    case "SET_SPEED":
      return { ...state, speedMs: action.speedMs };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadTrace = useCallback(async (algorithmId: string, values: number[]) => {
    dispatch({ type: "TRACE_LOADING" });
    try {
      const trace = await fetchTrace(algorithmId, values);
      dispatch({ type: "TRACE_SUCCESS", trace });
    } catch (err) {
      dispatch({
        type: "TRACE_ERROR",
        error: err instanceof Error ? err.message : "Failed to load trace",
      });
    }
  }, []);

  const runCurrentArray = useCallback(
    (algorithmId: string, text: string) => {
      const parsed = parseArrayInput(text);
      if ("error" in parsed) {
        dispatch({ type: "TRACE_ERROR", error: parsed.error });
        return;
      }
      void loadTrace(algorithmId, parsed.values);
    },
    [loadTrace],
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
        await loadTrace(firstId, values);
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: "TRACE_ERROR",
            error: err instanceof Error ? err.message : "Failed to load algorithms",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTrace]);

  useEffect(() => {
    if (!state.playing || !state.trace) return;
    if (state.stepIndex >= lastIndex(state.trace)) {
      dispatch({ type: "PAUSE" });
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: "STEP_FORWARD" });
    }, state.speedMs);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.stepIndex, state.speedMs, state.trace]);

  const currentStep = state.trace?.steps[state.stepIndex] ?? null;
  const resetKey = state.trace
    ? `${state.trace.algorithm}:${state.trace.input.join(",")}`
    : "empty";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Sorting · v1
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            DSA Visualizer
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Python traces every comparison and swap. The browser just plays the
            film. Switch algorithms on the same array to see how they differ.
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted">
          API {API_BASE}
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <AlgorithmPicker
          algorithms={state.algorithms}
          selectedId={state.algorithmId}
          disabled={state.loading}
          onSelect={(id) => {
            dispatch({ type: "SELECT_ALGORITHM", id });
            runCurrentArray(id, state.arrayText);
          }}
        />
        <div className="mt-5 border-t border-line pt-5">
          <ArrayInput
            value={state.arrayText}
            size={state.size}
            disabled={state.loading}
            onChange={(text) => dispatch({ type: "SET_ARRAY_TEXT", text })}
            onSizeChange={(size) => dispatch({ type: "SET_SIZE", size })}
            onRandomize={() => {
              const values = generateRandomArray(state.size);
              dispatch({ type: "SET_ARRAY_TEXT", text: values.join(", ") });
              if (state.algorithmId) void loadTrace(state.algorithmId, values);
            }}
            onSubmit={() => runCurrentArray(state.algorithmId, state.arrayText)}
          />
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
          <p className="min-h-[2.5rem] max-w-3xl text-base leading-snug text-ink sm:text-lg">
            {state.loading
              ? "Computing trace…"
              : (currentStep?.message ?? "—")}
          </p>
          <dl className="flex gap-6 font-mono text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                Comparisons
              </dt>
              <dd className="text-lg text-gold">
                {currentStep?.comparisons ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                Swaps
              </dt>
              <dd className="text-lg text-gold">{currentStep?.swaps ?? 0}</dd>
            </div>
          </dl>
        </div>

        <div className="min-h-[280px] flex-1">
          <BarChart key={resetKey} step={currentStep} />
        </div>

        <PlaybackControls
          stepIndex={state.stepIndex}
          totalSteps={state.trace?.total_steps ?? 0}
          playing={state.playing}
          speedMs={state.speedMs}
          disabled={state.loading || !state.trace}
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
