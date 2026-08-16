"use client";

import type { AlgorithmInfo } from "@/lib/types";

const CATEGORIES: { id: string; label: string }[] = [
  { id: "sorting", label: "Sorting" },
  { id: "graph", label: "Graph" },
];

interface AlgorithmPickerProps {
  algorithms: AlgorithmInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function AlgorithmPicker({
  algorithms,
  selectedId,
  onSelect,
  disabled = false,
}: AlgorithmPickerProps) {
  const selected = algorithms.find((alg) => alg.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {CATEGORIES.map((category) => {
        const group = algorithms.filter((alg) => alg.category === category.id);
        if (algorithms.length > 0 && group.length === 0) return null;
        const items =
          group.length > 0
            ? group
            : category.id === "sorting"
              ? placeholderAlgs(["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"])
              : placeholderAlgs(["BFS", "DFS", "Dijkstra"]);

        return (
          <div key={category.id} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {category.label}
            </p>
            <div
              role="tablist"
              aria-label={`${category.label} algorithms`}
              className="flex flex-wrap gap-1 rounded-xl border border-line bg-canvas/60 p-1"
            >
              {items.map((alg) => {
                if ("placeholder" in alg) {
                  return (
                    <div
                      key={alg.label}
                      className="h-9 w-24 animate-pulse rounded-lg bg-line/70"
                    />
                  );
                }
                const active = alg.id === selectedId;
                return (
                  <button
                    key={alg.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={disabled}
                    onClick={() => onSelect(alg.id)}
                    className={
                      active
                        ? "rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-canvas"
                        : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-line/60 hover:text-ink disabled:opacity-50"
                    }
                  >
                    {alg.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {selected ? (
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          {selected.description}
        </p>
      ) : null}
    </div>
  );
}

function placeholderAlgs(labels: string[]) {
  return labels.map((label) => ({ placeholder: true as const, label }));
}
