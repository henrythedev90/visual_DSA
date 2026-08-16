import type { AlgorithmInfo, TraceResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export { API_BASE };

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
