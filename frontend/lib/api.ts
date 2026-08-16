import type {
  AlgorithmInfo,
  GraphTraceRequest,
  GraphTraceResponse,
  GraphTraceStep,
  StreamMeta,
  TraceRequest,
  TraceResponse,
  TraceStep,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export { API_BASE };

function wsUrl(path: string): string {
  return `${API_BASE.replace(/^http/, "ws")}${path}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg);
          }
          return JSON.stringify(item);
        })
        .join("; ");
    }
  } catch {
    // fall through to status text
  }
  return `${res.status} ${res.statusText}`;
}

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`);
  } catch {
    throw new Error(
      `Can't reach the API at ${API_BASE}. Start the backend with uvicorn (see README).`,
    );
  }
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Can't reach the API at ${API_BASE}. Start the backend with uvicorn (see README).`,
    );
  }
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}

export function fetchAlgorithms(): Promise<AlgorithmInfo[]> {
  return getJson<AlgorithmInfo[]>("/api/algorithms");
}

export function fetchTrace(
  algorithm: string,
  array: number[],
): Promise<TraceResponse> {
  const qs = encodeURIComponent(array.join(","));
  return getJson<TraceResponse>(`/api/trace/${algorithm}?array=${qs}`);
}

export function fetchGraphTrace(
  algorithm: string,
  body: GraphTraceRequest,
): Promise<GraphTraceResponse> {
  return postJson<GraphTraceResponse>(`/api/graph-trace/${algorithm}`, body);
}

export interface StreamHandlers {
  onMeta: (meta: StreamMeta) => void;
  onStep: (step: TraceStep | GraphTraceStep) => void;
  onDone: (totalSteps: number) => void;
  onError: (message: string) => void;
}

export function streamTrace(
  algorithm: string,
  payload: TraceRequest | GraphTraceRequest,
  handlers: StreamHandlers,
): () => void {
  const socket = new WebSocket(wsUrl(`/ws/trace/${algorithm}`));
  let settled = false;

  socket.onopen = () => {
    socket.send(JSON.stringify(payload));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data as string) as
      | StreamMeta
      | { type: "step"; data: TraceStep | GraphTraceStep }
      | { type: "done"; total_steps: number }
      | { type: "error"; detail?: string };

    if (message.type === "error") {
      settled = true;
      handlers.onError(message.detail ?? "WebSocket error");
      socket.close();
      return;
    }
    if (message.type === "meta") {
      handlers.onMeta(message);
      return;
    }
    if (message.type === "step") {
      handlers.onStep(message.data);
      return;
    }
    if (message.type === "done") {
      settled = true;
      handlers.onDone(message.total_steps);
      socket.close();
    }
  };

  socket.onerror = () => {
    if (!settled) {
      handlers.onError(
        `WebSocket failed at ${wsUrl(`/ws/trace/${algorithm}`)}. Is the backend running?`,
      );
    }
  };

  return () => {
    settled = true;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
}

export function generateRandomArray(size: number): number[] {
  const pool = Array.from({ length: 100 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}

export function parseArrayInput(
  text: string,
): { values: number[] } | { error: string } {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { error: "Enter a comma-separated list of integers." };
  }

  const values: number[] = [];
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n)) {
      return { error: `"${part}" is not an integer.` };
    }
    values.push(n);
  }

  if (values.length < 2 || values.length > 100) {
    return { error: "Array must have between 2 and 100 elements." };
  }

  return { values };
}

export function cellsEqual(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function scatterWalls(
  rows: number,
  cols: number,
  start: [number, number],
  end: [number, number],
  density = 0.22,
): [number, number][] {
  const walls: [number, number][] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell: [number, number] = [r, c];
      if (cellsEqual(cell, start) || cellsEqual(cell, end)) continue;
      const nearStart = Math.abs(r - start[0]) + Math.abs(c - start[1]) <= 1;
      const nearEnd = Math.abs(r - end[0]) + Math.abs(c - end[1]) <= 1;
      if (nearStart || nearEnd) continue;
      if (Math.random() < density) walls.push(cell);
    }
  }
  return walls;
}
