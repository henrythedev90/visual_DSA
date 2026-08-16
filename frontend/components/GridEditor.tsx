"use client";

import type { PaintMode } from "@/lib/types";

const MIN_GRID = 5;
const MAX_GRID = 50;

interface GridEditorProps {
  rows: number;
  cols: number;
  paintMode: PaintMode;
  disabled?: boolean;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  onPaintModeChange: (mode: PaintMode) => void;
  onScatter: () => void;
  onClear: () => void;
  onSubmit: () => void;
}

const MODES: { id: PaintMode; label: string }[] = [
  { id: "wall", label: "Walls" },
  { id: "start", label: "Start" },
  { id: "end", label: "End" },
];

export function GridEditor({
  rows,
  cols,
  paintMode,
  disabled = false,
  onRowsChange,
  onColsChange,
  onPaintModeChange,
  onScatter,
  onClear,
  onSubmit,
}: GridEditorProps) {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-canvas/60 p-1">
        {MODES.map((mode) => {
          const active = paintMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onPaintModeChange(mode.id)}
              className={
                active
                  ? "rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-canvas"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-line/60 hover:text-ink disabled:opacity-50"
              }
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        {paintMode === "wall"
          ? "Click and drag on the grid to paint or erase walls."
          : paintMode === "start"
            ? "Click a cell to move the start."
            : "Click a cell to move the end."}
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <SizeSlider
          label="Rows"
          value={rows}
          disabled={disabled}
          onChange={onRowsChange}
        />
        <SizeSlider
          label="Cols"
          value={cols}
          disabled={disabled}
          onChange={onColsChange}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onScatter}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:border-gold/50 hover:text-gold disabled:opacity-50"
        >
          Scatter walls
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:border-gold/50 hover:text-gold disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-canvas hover:bg-gold/90 disabled:opacity-50"
        >
          Visualize
        </button>
      </div>
    </form>
  );
}

function SizeSlider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-35 flex-1 flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
        {label}
        <span className="font-mono text-ink">{value}</span>
      </span>
      <input
        type="range"
        min={MIN_GRID}
        max={MAX_GRID}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-gold"
      />
    </label>
  );
}
