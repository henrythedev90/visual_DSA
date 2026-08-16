"use client";

import { LayoutGroup, motion } from "framer-motion";
import { useState } from "react";

import type { Highlight, HighlightRole, TraceStep } from "@/lib/types";

const ROLE_COLOR: Record<HighlightRole, string> = {
  comparing: "#e8c547",
  swapping: "#e85d4c",
  sorted: "#3ecf8e",
  pivot: "#b57bff",
  merging: "#2ec4b6",
  active_range: "#4a6fa5",
};

const UNHIGHLIGHTED = "#3d4554";

const ROLE_PRIORITY: HighlightRole[] = [
  "swapping",
  "comparing",
  "pivot",
  "merging",
  "sorted",
  "active_range",
];

const LEGEND: { role: HighlightRole; label: string }[] = [
  { role: "comparing", label: "Comparing" },
  { role: "swapping", label: "Swapping" },
  { role: "sorted", label: "Sorted" },
  { role: "pivot", label: "Pivot" },
  { role: "merging", label: "Merging" },
  { role: "active_range", label: "Active range" },
];

interface Bar {
  id: string;
  value: number;
}

function roleForIndex(
  highlights: Highlight[],
  index: number,
): HighlightRole | null {
  const roles = highlights
    .filter((h) => h.index === index)
    .map((h) => h.role);
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return null;
}

function reconcile(prev: Bar[] | null, values: number[]): Bar[] {
  if (!prev || prev.length === 0) {
    return values.map((value, i) => ({ id: `el-${i}`, value }));
  }
  const available = [...prev];
  return values.map((value) => {
    const idx = available.findIndex((bar) => bar.value === value);
    if (idx >= 0) {
      const [matched] = available.splice(idx, 1);
      return matched;
    }
    return { id: `el-extra-${value}-${available.length}`, value };
  });
}

interface BarChartProps {
  step: TraceStep | null;
}

const EMPTY_ARRAY: number[] = [];

export function BarChart({ step }: BarChartProps) {
  const values = step?.array ?? EMPTY_ARRAY;
  const [bars, setBars] = useState<Bar[]>(() => reconcile(null, values));
  const [prevValues, setPrevValues] = useState(values);

  let visibleBars = bars;
  if (values !== prevValues) {
    visibleBars = reconcile(bars, values);
    setPrevValues(values);
    setBars(visibleBars);
  }

  const min = values.length ? Math.min(0, ...values) : 0;
  const max = values.length ? Math.max(...values, 1) : 1;
  const span = max - min || 1;
  const showLabels = visibleBars.length > 0 && visibleBars.length <= 24;

  return (
    <div className="flex h-full min-h-[280px] flex-col gap-4">
      <div className="relative h-72 w-full sm:h-80">
        {visibleBars.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Load a trace to begin.
          </div>
        ) : (
          <LayoutGroup>
            <div className="flex h-full w-full items-stretch gap-[3px] sm:gap-1.5">
              {visibleBars.map((bar, index) => {
                const role = step
                  ? roleForIndex(step.highlights, index)
                  : null;
                const color = role ? ROLE_COLOR[role] : UNHIGHLIGHTED;
                const heightPct = ((bar.value - min) / span) * 100;

                return (
                  <motion.div
                    key={bar.id}
                    layout
                    className="flex h-full min-w-0 flex-1 flex-col"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  >
                    <div className="flex min-h-0 flex-1 items-end">
                      <motion.div
                        className="w-full rounded-t-[3px]"
                        initial={false}
                        animate={{
                          height: `${Math.max(heightPct, 4)}%`,
                          backgroundColor: color,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 34,
                        }}
                        title={`${bar.value}`}
                      />
                    </div>
                    {showLabels ? (
                      <span className="mt-1 text-center font-mono text-[10px] text-muted sm:text-xs">
                        {bar.value}
                      </span>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </LayoutGroup>
        )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: ROLE_COLOR[item.role] }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
