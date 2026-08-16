"use client";

import type { AlgorithmInfo } from "@/lib/types";

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
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Sorting algorithm"
        className="flex flex-wrap gap-1 rounded-xl border border-line bg-canvas/60 p-1"
      >
        {algorithms.length === 0
          ? ["Bubble Sort", "Insertion Sort", "Merge Sort", "Quick Sort"].map(
              (label) => (
                <div
                  key={label}
                  className="h-9 w-28 animate-pulse rounded-lg bg-line/70"
                />
              ),
            )
          : algorithms.map((alg) => {
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
      {selected ? (
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          {selected.description}
        </p>
      ) : null}
    </div>
  );
}
