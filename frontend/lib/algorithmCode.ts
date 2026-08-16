/** Textbook listings shown beside the visualizer.

Each `#@id` / `// @id` tag is stripped for display. Trace steps send the
same id in `focus` so the code panel can highlight the live line in any
language.
*/

export type CodeLanguage = "python" | "javascript" | "java" | "cpp";

export const CODE_LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

export interface CodeLine {
  text: string;
  id?: string;
}

export interface AlgorithmListing {
  filename: string;
  lines: CodeLine[];
}

function listing(filename: string, source: string): AlgorithmListing {
  const lines = source
    .replace(/^\n/, "")
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => {
      const match = /^(.*?)\s+(?:#|\/\/)\s*@([a-z_]+)\s*$/.exec(line);
      if (!match) return { text: line };
      return { text: match[1].trimEnd(), id: match[2] };
    });
  return { filename, lines };
}

type Polyglot = Record<CodeLanguage, AlgorithmListing>;

function polyglot(files: Record<CodeLanguage, [string, string]>): Polyglot {
  return {
    python: listing(files.python[0], files.python[1]),
    javascript: listing(files.javascript[0], files.javascript[1]),
    java: listing(files.java[0], files.java[1]),
    cpp: listing(files.cpp[0], files.cpp[1]),
  };
}

const SOURCES: Record<string, Polyglot> = {
  "bubble-sort": polyglot({
    python: [
      "bubble_sort.py",
      `
def bubble_sort(a):
    n = len(a)  #@start
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:  #@compare
                a[j], a[j + 1] = a[j + 1], a[j]  #@swap
                swapped = True
        # a[n - 1 - i] is now in final position  #@finalize
        if not swapped:
            break  #@already_sorted
    return a  #@done
`,
    ],
    javascript: [
      "bubbleSort.js",
      `
function bubbleSort(a) {
  const n = a.length;  // @start
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {  // @compare
        [a[j], a[j + 1]] = [a[j + 1], a[j]];  // @swap
        swapped = true;
      }
    }
    // a[n - 1 - i] is now in final position  // @finalize
    if (!swapped) break;  // @already_sorted
  }
  return a;  // @done
}
`,
    ],
    java: [
      "BubbleSort.java",
      `
void bubbleSort(int[] a) {
    int n = a.length;  // @start
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {  // @compare
                int tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp;  // @swap
                swapped = true;
            }
        }
        // a[n - 1 - i] is now in final position  // @finalize
        if (!swapped) break;  // @already_sorted
    }
}  // @done
`,
    ],
    cpp: [
      "bubble_sort.cpp",
      `
void bubbleSort(vector<int>& a) {
    int n = a.size();  // @start
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {  // @compare
                swap(a[j], a[j + 1]);  // @swap
                swapped = true;
            }
        }
        // a[n - 1 - i] is now in final position  // @finalize
        if (!swapped) break;  // @already_sorted
    }
}  // @done
`,
    ],
  }),

  "insertion-sort": polyglot({
    python: [
      "insertion_sort.py",
      `
def insertion_sort(a):  #@start
    for i in range(1, len(a)):
        key = a[i]  #@pick
        j = i - 1
        while j >= 0 and a[j] > key:  #@compare
            a[j + 1] = a[j]  #@shift
            j -= 1
        a[j + 1] = key  #@insert
        # a[0..i] is a sorted prefix  #@prefix
    return a  #@done
`,
    ],
    javascript: [
      "insertionSort.js",
      `
function insertionSort(a) {  // @start
  for (let i = 1; i < a.length; i++) {
    const key = a[i];  // @pick
    let j = i - 1;
    while (j >= 0 && a[j] > key) {  // @compare
      a[j + 1] = a[j];  // @shift
      j--;
    }
    a[j + 1] = key;  // @insert
    // a[0..i] is a sorted prefix  // @prefix
  }
  return a;  // @done
}
`,
    ],
    java: [
      "InsertionSort.java",
      `
void insertionSort(int[] a) {  // @start
    for (int i = 1; i < a.length; i++) {
        int key = a[i];  // @pick
        int j = i - 1;
        while (j >= 0 && a[j] > key) {  // @compare
            a[j + 1] = a[j];  // @shift
            j--;
        }
        a[j + 1] = key;  // @insert
        // a[0..i] is a sorted prefix  // @prefix
    }
}  // @done
`,
    ],
    cpp: [
      "insertion_sort.cpp",
      `
void insertionSort(vector<int>& a) {  // @start
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i];  // @pick
        int j = i - 1;
        while (j >= 0 && a[j] > key) {  // @compare
            a[j + 1] = a[j];  // @shift
            j--;
        }
        a[j + 1] = key;  // @insert
        // a[0..i] is a sorted prefix  // @prefix
    }
}  // @done
`,
    ],
  }),

  "merge-sort": polyglot({
    python: [
      "merge_sort.py",
      `
def merge_sort(a):
    def sort(lo, hi):
        if hi - lo <= 1:  #@base
            return
        mid = (lo + hi) // 2  #@split
        sort(lo, mid)
        sort(mid, hi)
        merge(lo, mid, hi)

    def merge(lo, mid, hi):
        left, right = a[lo:mid], a[mid:hi]  #@merge
        i = j = 0
        k = lo
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:  #@compare
                chosen = left[i]
                i += 1
            else:
                chosen = right[j]
                j += 1
            a[k] = chosen  #@place
            k += 1
        while i < len(left) or j < len(right):  #@remainder
            if i < len(left):
                a[k] = left[i]
                i += 1
            else:
                a[k] = right[j]
                j += 1
            k += 1
        # a[lo:hi] is now sorted  #@merged

    sort(0, len(a))  #@start
    return a  #@done
`,
    ],
    javascript: [
      "mergeSort.js",
      `
function mergeSort(a) {
  function sort(lo, hi) {
    if (hi - lo <= 1) return;  // @base
    const mid = Math.floor((lo + hi) / 2);  // @split
    sort(lo, mid);
    sort(mid, hi);
    merge(lo, mid, hi);
  }

  function merge(lo, mid, hi) {
    const left = a.slice(lo, mid), right = a.slice(mid, hi);  // @merge
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      let chosen;
      if (left[i] <= right[j]) {  // @compare
        chosen = left[i++];
      } else {
        chosen = right[j++];
      }
      a[k] = chosen;  // @place
      k++;
    }
    while (i < left.length || j < right.length) {  // @remainder
      a[k++] = i < left.length ? left[i++] : right[j++];
    }
    // a[lo:hi] is now sorted  // @merged
  }

  sort(0, a.length);  // @start
  return a;  // @done
}
`,
    ],
    java: [
      "MergeSort.java",
      `
void mergeSort(int[] a) {
    sort(a, 0, a.length);  // @start
}

void sort(int[] a, int lo, int hi) {
    if (hi - lo <= 1) return;  // @base
    int mid = (lo + hi) / 2;  // @split
    sort(a, lo, mid);
    sort(a, mid, hi);
    merge(a, lo, mid, hi);
}

void merge(int[] a, int lo, int mid, int hi) {
    int[] left = Arrays.copyOfRange(a, lo, mid);  // @merge
    int[] right = Arrays.copyOfRange(a, mid, hi);
    int i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
        int chosen;
        if (left[i] <= right[j]) {  // @compare
            chosen = left[i++];
        } else {
            chosen = right[j++];
        }
        a[k] = chosen;  // @place
        k++;
    }
    while (i < left.length || j < right.length) {  // @remainder
        a[k++] = i < left.length ? left[i++] : right[j++];
    }
    // a[lo:hi] is now sorted  // @merged
}  // @done
`,
    ],
    cpp: [
      "merge_sort.cpp",
      `
void mergeSort(vector<int>& a) {
    sortRange(a, 0, a.size());  // @start
}

void sortRange(vector<int>& a, int lo, int hi) {
    if (hi - lo <= 1) return;  // @base
    int mid = (lo + hi) / 2;  // @split
    sortRange(a, lo, mid);
    sortRange(a, mid, hi);
    merge(a, lo, mid, hi);
}

void merge(vector<int>& a, int lo, int mid, int hi) {
    vector<int> left(a.begin()+lo, a.begin()+mid);  // @merge
    vector<int> right(a.begin()+mid, a.begin()+hi);
    int i = 0, j = 0, k = lo;
    while (i < (int)left.size() && j < (int)right.size()) {
        int chosen;
        if (left[i] <= right[j]) {  // @compare
            chosen = left[i++];
        } else {
            chosen = right[j++];
        }
        a[k] = chosen;  // @place
        k++;
    }
    while (i < (int)left.size() || j < (int)right.size()) {  // @remainder
        a[k++] = i < (int)left.size() ? left[i++] : right[j++];
    }
    // a[lo:hi] is now sorted  // @merged
}  // @done
`,
    ],
  }),

  "quick-sort": polyglot({
    python: [
      "quick_sort.py",
      `
def quick_sort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1  #@start
    if lo >= hi:  #@base
        return
    pivot = a[hi]  #@pivot
    i = lo
    for j in range(lo, hi):
        if a[j] <= pivot:  #@compare
            a[i], a[j] = a[j], a[i]  #@swap
            i += 1
    a[i], a[hi] = a[hi], a[i]  #@place_pivot
    quick_sort(a, lo, i - 1)  #@recurse
    quick_sort(a, i + 1, hi)
    return a  #@done
`,
    ],
    javascript: [
      "quickSort.js",
      `
function quickSort(a, lo = 0, hi = a.length - 1) {
  if (arguments.length < 3) hi = a.length - 1;  // @start
  if (lo >= hi) return;  // @base
  const pivot = a[hi];  // @pivot
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] <= pivot) {  // @compare
      [a[i], a[j]] = [a[j], a[i]];  // @swap
      i++;
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]];  // @place_pivot
  quickSort(a, lo, i - 1);  // @recurse
  quickSort(a, i + 1, hi);
  return a;  // @done
}
`,
    ],
    java: [
      "QuickSort.java",
      `
void quickSort(int[] a) {
    quickSort(a, 0, a.length - 1);  // @start
}

void quickSort(int[] a, int lo, int hi) {
    if (lo >= hi) return;  // @base
    int pivot = a[hi];  // @pivot
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] <= pivot) {  // @compare
            int tmp = a[i]; a[i] = a[j]; a[j] = tmp;  // @swap
            i++;
        }
    }
    int tmp = a[i]; a[i] = a[hi]; a[hi] = tmp;  // @place_pivot
    quickSort(a, lo, i - 1);  // @recurse
    quickSort(a, i + 1, hi);
}  // @done
`,
    ],
    cpp: [
      "quick_sort.cpp",
      `
void quickSort(vector<int>& a, int lo, int hi) {
    if (hi < 0) hi = (int)a.size() - 1;  // @start
    if (lo >= hi) return;  // @base
    int pivot = a[hi];  // @pivot
    int i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] <= pivot) {  // @compare
            swap(a[i], a[j]);  // @swap
            i++;
        }
    }
    swap(a[i], a[hi]);  // @place_pivot
    quickSort(a, lo, i - 1);  // @recurse
    quickSort(a, i + 1, hi);
}  // @done
`,
    ],
  }),

  bfs: polyglot({
    python: [
      "bfs.py",
      `
from collections import deque

def bfs(start, end, neighbors):
    queue = deque([start])  #@init
    parent = {}
    visited = set()
    while queue:
        current = queue.popleft()  #@visit
        if current == end:  #@found
            return reconstruct(parent, start, end)  #@path
        visited.add(current)
        for nxt in neighbors(current):
            if nxt not in visited:
                parent[nxt] = current
                queue.append(nxt)  #@enqueue
    return None  #@none
`,
    ],
    javascript: [
      "bfs.js",
      `
function bfs(start, end, neighbors) {
  const queue = [start];  // @init
  const parent = new Map();
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();  // @visit
    if (current === end) {  // @found
      return reconstruct(parent, start, end);  // @path
    }
    visited.add(current);
    for (const nxt of neighbors(current)) {
      if (!visited.has(nxt)) {
        parent.set(nxt, current);
        queue.push(nxt);  // @enqueue
      }
    }
  }
  return null;  // @none
}
`,
    ],
    java: [
      "Bfs.java",
      `
List<Cell> bfs(Cell start, Cell end) {
    Queue<Cell> queue = new ArrayDeque<>();  // @init
    queue.add(start);
    Map<Cell, Cell> parent = new HashMap<>();
    Set<Cell> visited = new HashSet<>();
    while (!queue.isEmpty()) {
        Cell current = queue.remove();  // @visit
        if (current.equals(end)) {  // @found
            return reconstruct(parent, start, end);  // @path
        }
        visited.add(current);
        for (Cell nxt : neighbors(current)) {
            if (!visited.contains(nxt)) {
                parent.put(nxt, current);
                queue.add(nxt);  // @enqueue
            }
        }
    }
    return null;  // @none
}
`,
    ],
    cpp: [
      "bfs.cpp",
      `
vector<Cell> bfs(Cell start, Cell end) {
    queue<Cell> q;  // @init
    q.push(start);
    map<Cell, Cell> parent;
    set<Cell> visited;
    while (!q.empty()) {
        Cell current = q.front(); q.pop();  // @visit
        if (current == end) {  // @found
            return reconstruct(parent, start, end);  // @path
        }
        visited.insert(current);
        for (Cell nxt : neighbors(current)) {
            if (!visited.count(nxt)) {
                parent[nxt] = current;
                q.push(nxt);  // @enqueue
            }
        }
    }
    return {};  // @none
}
`,
    ],
  }),

  dfs: polyglot({
    python: [
      "dfs.py",
      `
def dfs(start, end, neighbors):
    stack = [start]  #@init
    parent = {}
    visited = set()
    while stack:
        current = stack.pop()  #@visit
        if current in visited:
            continue
        if current == end:  #@found
            return reconstruct(parent, start, end)  #@path
        visited.add(current)
        for nxt in neighbors(current):
            if nxt not in visited:
                parent[nxt] = current
                stack.append(nxt)  #@push
    return None  #@none
`,
    ],
    javascript: [
      "dfs.js",
      `
function dfs(start, end, neighbors) {
  const stack = [start];  // @init
  const parent = new Map();
  const visited = new Set();
  while (stack.length) {
    const current = stack.pop();  // @visit
    if (visited.has(current)) continue;
    if (current === end) {  // @found
      return reconstruct(parent, start, end);  // @path
    }
    visited.add(current);
    for (const nxt of neighbors(current)) {
      if (!visited.has(nxt)) {
        parent.set(nxt, current);
        stack.push(nxt);  // @push
      }
    }
  }
  return null;  // @none
}
`,
    ],
    java: [
      "Dfs.java",
      `
List<Cell> dfs(Cell start, Cell end) {
    Deque<Cell> stack = new ArrayDeque<>();  // @init
    stack.push(start);
    Map<Cell, Cell> parent = new HashMap<>();
    Set<Cell> visited = new HashSet<>();
    while (!stack.isEmpty()) {
        Cell current = stack.pop();  // @visit
        if (visited.contains(current)) continue;
        if (current.equals(end)) {  // @found
            return reconstruct(parent, start, end);  // @path
        }
        visited.add(current);
        for (Cell nxt : neighbors(current)) {
            if (!visited.contains(nxt)) {
                parent.put(nxt, current);
                stack.push(nxt);  // @push
            }
        }
    }
    return null;  // @none
}
`,
    ],
    cpp: [
      "dfs.cpp",
      `
vector<Cell> dfs(Cell start, Cell end) {
    stack<Cell> st;  // @init
    st.push(start);
    map<Cell, Cell> parent;
    set<Cell> visited;
    while (!st.empty()) {
        Cell current = st.top(); st.pop();  // @visit
        if (visited.count(current)) continue;
        if (current == end) {  // @found
            return reconstruct(parent, start, end);  // @path
        }
        visited.insert(current);
        for (Cell nxt : neighbors(current)) {
            if (!visited.count(nxt)) {
                parent[nxt] = current;
                st.push(nxt);  // @push
            }
        }
    }
    return {};  // @none
}
`,
    ],
  }),

  dijkstra: polyglot({
    python: [
      "dijkstra.py",
      `
import heapq

def dijkstra(start, end, neighbors):
    dist = {start: 0}
    parent = {}
    visited = set()
    heap = [(0, start)]  #@init
    while heap:
        d, current = heapq.heappop(heap)  #@settle
        if current in visited:
            continue
        if current == end:  #@found
            return reconstruct(parent, start, end)  #@path
        visited.add(current)
        for nxt in neighbors(current):
            nd = d + 1
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd  #@relax
                parent[nxt] = current
                heapq.heappush(heap, (nd, nxt))
    return None  #@none
`,
    ],
    javascript: [
      "dijkstra.js",
      `
function dijkstra(start, end, neighbors) {
  const dist = new Map([[start, 0]]);
  const parent = new Map();
  const visited = new Set();
  const heap = [[0, start]];  // @init
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, current] = heap.shift();  // @settle
    if (visited.has(current)) continue;
    if (current === end) {  // @found
      return reconstruct(parent, start, end);  // @path
    }
    visited.add(current);
    for (const nxt of neighbors(current)) {
      const nd = d + 1;
      if (nd < (dist.get(nxt) ?? Infinity)) {
        dist.set(nxt, nd);  // @relax
        parent.set(nxt, current);
        heap.push([nd, nxt]);
      }
    }
  }
  return null;  // @none
}
`,
    ],
    java: [
      "Dijkstra.java",
      `
List<Cell> dijkstra(Cell start, Cell end) {
    Map<Cell, Integer> dist = new HashMap<>();
    dist.put(start, 0);
    Map<Cell, Cell> parent = new HashMap<>();
    Set<Cell> visited = new HashSet<>();
    PriorityQueue<int[]> heap = new PriorityQueue<>(Comparator.comparingInt(x -> x[0]));
    heap.add(new int[]{0, start.r, start.c});  // @init
    while (!heap.isEmpty()) {
        int[] top = heap.poll();  // @settle
        Cell current = new Cell(top[1], top[2]);
        int d = top[0];
        if (visited.contains(current)) continue;
        if (current.equals(end)) {  // @found
            return reconstruct(parent, start, end);  // @path
        }
        visited.add(current);
        for (Cell nxt : neighbors(current)) {
            int nd = d + 1;
            if (nd < dist.getOrDefault(nxt, Integer.MAX_VALUE)) {
                dist.put(nxt, nd);  // @relax
                parent.put(nxt, current);
                heap.add(new int[]{nd, nxt.r, nxt.c});
            }
        }
    }
    return null;  // @none
}
`,
    ],
    cpp: [
      "dijkstra.cpp",
      `
vector<Cell> dijkstra(Cell start, Cell end) {
    map<Cell, int> dist;
    dist[start] = 0;
    map<Cell, Cell> parent;
    set<Cell> visited;
    priority_queue<pair<int, Cell>, vector<pair<int, Cell>>, greater<>> heap;
    heap.push({0, start});  // @init
    while (!heap.empty()) {
        auto [d, current] = heap.top(); heap.pop();  // @settle
        if (visited.count(current)) continue;
        if (current == end) {  // @found
            return reconstruct(parent, start, end);  // @path
        }
        visited.insert(current);
        for (Cell nxt : neighbors(current)) {
            int nd = d + 1;
            if (!dist.count(nxt) || nd < dist[nxt]) {
                dist[nxt] = nd;  // @relax
                parent[nxt] = current;
                heap.push({nd, nxt});
            }
        }
    }
    return {};  // @none
}
`,
    ],
  }),
};

export function isCodeLanguage(value: string): value is CodeLanguage {
  return CODE_LANGUAGES.some((lang) => lang.id === value);
}

export function getAlgorithmCode(
  algorithmId: string,
  language: CodeLanguage = "python",
): AlgorithmListing | null {
  return SOURCES[algorithmId]?.[language] ?? null;
}
