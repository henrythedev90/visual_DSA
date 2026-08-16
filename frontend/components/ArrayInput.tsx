"use client";

interface ArrayInputProps {
  value: string;
  size: number;
  onChange: (text: string) => void;
  onSizeChange: (size: number) => void;
  onRandomize: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ArrayInput({
  value,
  size,
  onChange,
  onSizeChange,
  onRandomize,
  onSubmit,
  disabled = false,
}: ArrayInputProps) {
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Array
        </span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          placeholder="5, 3, 8, 1, 9"
          className="rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none ring-gold/40 placeholder:text-muted/50 focus:ring-2 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
            Random size
            <span className="font-mono text-ink">{size}</span>
          </span>
          <input
            type="range"
            min={5}
            max={50}
            value={size}
            disabled={disabled}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className="accent-gold"
          />
        </label>

        <button
          type="button"
          disabled={disabled}
          onClick={onRandomize}
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
