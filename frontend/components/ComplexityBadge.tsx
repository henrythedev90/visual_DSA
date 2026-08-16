const COMPLEXITY: Record<string, { time: string; space: string }> = {
  "bubble-sort": { time: "O(n²)", space: "O(1)" },
  "insertion-sort": { time: "O(n²)", space: "O(1)" },
  "merge-sort": { time: "O(n log n)", space: "O(n)" },
  "quick-sort": { time: "O(n log n) avg", space: "O(log n)" },
  bfs: { time: "O(V + E)", space: "O(V)" },
  dfs: { time: "O(V + E)", space: "O(V)" },
  dijkstra: { time: "O((V + E) log V)", space: "O(V)" },
};

interface ComplexityBadgeProps {
  algorithmId: string;
}

export function ComplexityBadge({ algorithmId }: ComplexityBadgeProps) {
  const info = COMPLEXITY[algorithmId];
  if (!info) return null;

  return (
    <dl className="flex flex-wrap gap-3 font-mono text-xs">
      <div className="rounded-md border border-line bg-canvas/70 px-2 py-1">
        <dt className="uppercase tracking-wider text-muted">Time</dt>
        <dd className="text-gold">{info.time}</dd>
      </div>
      <div className="rounded-md border border-line bg-canvas/70 px-2 py-1">
        <dt className="uppercase tracking-wider text-muted">Space</dt>
        <dd className="text-gold">{info.space}</dd>
      </div>
    </dl>
  );
}
