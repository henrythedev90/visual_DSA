# DSA Algorithm Visualizer

Web visualizer for classic sorting algorithms. A **Python/FastAPI** backend runs the algorithm and records a step-by-step **trace** (array snapshot, highlights, caption, running comparison/swap counts). A **Next.js** frontend fetches that trace once and animates through it in the browser.

This split is intentional: algorithm correctness lives in Python (good DSA practice); animation lives in React (playback, colors, motion).

```
dsa-visualizer/
  backend/          FastAPI — traces computed on the fly, no database
  frontend/         Next.js App Router — plays a trace by step index
```

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

Check it:

- Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

```bash
curl "http://localhost:8000/api/algorithms"
curl "http://localhost:8000/api/trace/bubble-sort?array=5,3,8,1"
curl "http://localhost:8000/api/trace/quick-sort?size=12"
```

### 2. Frontend (port 3000)

```bash
cd frontend
cp .env.example .env.local         # optional; default is already http://localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The UI calls `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). CORS is wide open for local development — tighten `allow_origins` in `backend/app/main.py` before any real deploy.

## How a run works

1. Pick an algorithm (list comes from `GET /api/algorithms`, which is built from a registry — adding a new algorithm does not require route changes).
2. Enter a comma-separated array, or randomize with the size slider (5–50 on the UI; the API accepts 2–100).
3. The frontend fetches **one** trace: `GET /api/trace/{id}?array=5,3,8,1`.
4. Playback is entirely client-side: current step index, play/pause timer, speed (delay between steps). Stepping does not re-fetch.

Switching algorithms **reuses the same array**, so you can compare bubble vs insertion vs merge vs quick on identical input.

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | `{ "status": "ok" }` |
| `GET` | `/api/algorithms` | Registry metadata for the picker |
| `GET` | `/api/trace/{algorithm}?array=5,3,8,1` | Trace for an explicit array |
| `GET` | `/api/trace/{algorithm}?size=15` | Trace for a random array (default size 15) |
| `POST` | `/api/trace/{algorithm}` | Same, JSON body `{ "array": [...] }` or `{ "size": 20 }` |

Unknown algorithm ids return **404** listing the valid ids. Arrays outside 2–100 elements return **400**.

Each trace step includes:

- `array` — snapshot at that moment
- `highlights` — `{ index, role }` where role is `comparing` \| `swapping` \| `sorted` \| `pivot` \| `merging` \| `active_range`
- `message` — caption shown under the chart
- `comparisons` / `swaps` — running totals (`swaps` also counts insertion shifts and merge placements)

Trace generators are Python **generators** (`yield`, not `return`) so a later v2 can stream steps over a WebSocket without rewriting the algorithms.

## Adding a new algorithm

1. Add `backend/app/algorithms/<name>.py` with `trace_<name>(arr) -> Iterator[dict]`.
2. Register it in `backend/app/algorithms/__init__.py` (`ALGORITHM_REGISTRY`).
3. The list endpoint and `{algorithm}` routes pick it up automatically. Mirror any new highlight roles in `frontend/lib/types.ts` and the bar-color map.

## Bar colors

| Role | Meaning |
|------|---------|
| Yellow | comparing |
| Red | swapping / shifting |
| Green | sorted (final position, or insertion-sort prefix) |
| Purple | quicksort pivot |
| Teal | merge-sort merge |
| Steel blue | active recursive range |
| Gray | not highlighted (dimmed outside the active range) |

## v1 scope

Sorting only. No graph/pathfinding views, no WebSocket streaming, no database. Those are leftover room in the design, not missing features.
