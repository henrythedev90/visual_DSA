# DSA Algorithm Visualizer

Web visualizer for classic **sorting** and **pathfinding** algorithms. A **Python/FastAPI** backend runs the algorithm and records a step-by-step **trace**. A **Next.js** frontend fetches that trace (REST) or streams it (WebSocket) and animates through it in the browser.

This split is intentional: algorithm correctness lives in Python; animation lives in React.

```
dsa-visualizer/
  backend/          FastAPI — traces computed on the fly, no database
  frontend/         Next.js App Router — plays a trace by step index
```

Two trace *shapes* share one registry:

| Category | Algorithms | Visual |
|----------|------------|--------|
| `sorting` | bubble, insertion, merge, quick | bar chart |
| `graph` | BFS, DFS, Dijkstra | grid |

## Prerequisites

- Python 3.11+
- Node.js 20+

## Run locally

You need **two terminals**.

### 1. Backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

```bash
curl "http://localhost:8000/api/algorithms"
curl "http://localhost:8000/api/trace/bubble-sort?array=5,3,8,1"
curl -X POST "http://localhost:8000/api/graph-trace/bfs" \
  -H "Content-Type: application/json" \
  -d '{"rows":8,"cols":12,"start":[1,1],"end":[6,10],"walls":[[2,2],[3,2]]}'
```

### 2. Frontend (port 3000)

```bash
cd frontend
cp .env.example .env.local         # optional; default is already http://localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). CORS is wide open for local development — tighten `allow_origins` in `backend/app/main.py` before any real deploy.

## How a run works

**Sorting** — pick an algorithm, enter or randomize an array, fetch one trace, play it by step index. Switching sorting algorithms **reuses the same array**.

**Graph** — paint walls on the grid (or scatter them), place start/end, then visualize. Switching BFS / DFS / Dijkstra **reuses the same maze**. Click a cell to toggle walls; use the Start / End tools to move the terminals.

**WebSocket** — check “Stream over WebSocket” to receive steps as the generator yields them (`WS /ws/trace/{algorithm}`) instead of waiting for a full JSON blob. Incoming steps are buffered, so step-back still works on what has arrived. PlaybackControls are shared; they do not care which trace shape is playing.

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | `{ "status": "ok" }` |
| `GET` | `/api/algorithms` | Registry metadata (both categories) |
| `GET` | `/api/trace/{algorithm}?array=5,3,8,1` | Sorting trace |
| `GET` | `/api/trace/{algorithm}?size=15` | Sorting trace, random array |
| `POST` | `/api/trace/{algorithm}` | Sorting trace, JSON `{ "array": [...] }` or `{ "size": 20 }` |
| `POST` | `/api/graph-trace/{algorithm}` | Graph trace, JSON `GraphTraceRequest` |
| `WS` | `/ws/trace/{algorithm}` | Stream either shape, one step at a time |

Graph uses a **parallel** REST path instead of overloading `POST /api/trace`. The sorting POST body and the graph POST body are unrelated; keeping them on one URL would muddy OpenAPI and risk breaking v1 clients.

Unknown algorithm ids return **404**. Arrays outside 2–100 elements, or grids outside 5×5–50×50, return **400**. Start/end must be in-bounds, distinct, and not on a wall. Walls are deduplicated.

### WebSocket protocol

Client connects, then sends one JSON message (`TraceRequest` or `GraphTraceRequest`). Server replies:

1. `{ "type": "meta", "category": "sorting"|"graph", ...header fields }`
2. `{ "type": "step", "data": <TraceStep or GraphTraceStep> }` (repeated)
3. `{ "type": "done", "total_steps": N }`

Errors: `{ "type": "error", "detail": "..." }`.

That `type` wrapper is a small addition on top of the raw step models so the client can tell meta / step / done apart. The step `data` is still the same Pydantic shape as REST.

## Adding a new algorithm

**Sorting:** `trace_<name>(arr) -> Iterator[dict]`, register with `category: "sorting"`.

**Graph:** `trace_<name>(rows, cols, start, end, walls) -> Iterator[dict]`, register with `category: "graph"`. Shared snapshot helpers live in `backend/app/algorithms/grid.py`.

The list endpoint picks up either automatically. Mirror new roles/states in `frontend/lib/types.ts`.

## Colors

**Bars (sorting)** — yellow comparing, red swapping, green sorted, purple pivot, teal merging, steel-blue active range, gray otherwise.

**Grid (graph)** — green start, red end, black wall, light-blue frontier, blue visited, orange current, gold path.

## Complexity

The UI shows time/space Big-O from a static frontend table (`ComplexityBadge`), keyed by algorithm id — not a backend endpoint.
