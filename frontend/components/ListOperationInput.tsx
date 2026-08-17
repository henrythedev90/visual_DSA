"use client";

import {
  LIST_OPS_NEED_INDEX,
  LIST_OPS_NEED_VALUE,
  generateRandomArray,
  listKindFromId,
  listOpFromId,
} from "@/lib/api";
import type { ListKind } from "@/lib/types";

interface ListOperationInputProps {
  algorithmId: string;
  valuesText: string;
  operationValue: string;
  operationIndex: string;
  disabled?: boolean;
  onValuesChange: (text: string) => void;
  onOperationValueChange: (text: string) => void;
  onOperationIndexChange: (text: string) => void;
  onKindChange: (kind: ListKind) => void;
  onRandomize: (values: number[]) => void;
  onSubmit: () => void;
}

export function ListOperationInput({
  algorithmId,
  valuesText,
  operationValue,
  operationIndex,
  disabled = false,
  onValuesChange,
  onOperationValueChange,
  onOperationIndexChange,
  onKindChange,
  onRandomize,
  onSubmit,
}: ListOperationInputProps) {
  const kind = listKindFromId(algorithmId);
  const op = listOpFromId(algorithmId);
  const needsValue = LIST_OPS_NEED_VALUE.has(op);
  const needsIndex = LIST_OPS_NEED_INDEX.has(op);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          List type
        </span>
        {(["singly", "doubly"] as const).map((option) => {
          const active = kind === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onKindChange(option)}
              className={
                active
                  ? "rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-canvas"
                  : "rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted hover:border-gold/50 hover:text-ink disabled:opacity-50"
              }
            >
              {option === "singly" ? "Singly" : "Doubly"}
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Initial list (head → tail)
        </span>
        <input
          type="text"
          value={valuesText}
          disabled={disabled}
          onChange={(event) => onValuesChange(event.target.value)}
          spellCheck={false}
          placeholder="3, 1, 4, 2  (empty list is allowed)"
          className="rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none ring-gold/40 placeholder:text-muted/50 focus:ring-2 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        {needsValue ? (
          <label className="flex w-28 flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Value
            </span>
            <input
              type="text"
              value={operationValue}
              disabled={disabled}
              onChange={(event) => onOperationValueChange(event.target.value)}
              inputMode="numeric"
              placeholder="7"
              className="rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-50"
            />
          </label>
        ) : null}

        {needsIndex ? (
          <label className="flex w-28 flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Index
            </span>
            <input
              type="text"
              value={operationIndex}
              disabled={disabled}
              onChange={(event) => onOperationIndexChange(event.target.value)}
              inputMode="numeric"
              placeholder="1"
              className="rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none ring-gold/40 focus:ring-2 disabled:opacity-50"
            />
          </label>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={() => onRandomize(generateRandomArray(5))}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:border-gold/50 hover:text-gold disabled:opacity-50"
        >
          Randomize
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
