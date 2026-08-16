"use client";

interface PlaybackControlsProps {
  stepIndex: number;
  totalSteps: number;
  playing: boolean;
  speedMs: number;
  disabled?: boolean;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (ms: number) => void;
}

export function PlaybackControls({
  stepIndex,
  totalSteps,
  playing,
  speedMs,
  disabled = false,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) {
  const lastStep = Math.max(totalSteps - 1, 0);
  const displayStep = totalSteps === 0 ? 0 : stepIndex + 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Step backward"
            disabled={disabled || stepIndex <= 0}
            onClick={onStepBack}
            className="rounded-lg border border-line px-3 py-2 text-ink hover:border-gold/50 disabled:opacity-40"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            disabled={disabled || totalSteps === 0}
            onClick={onTogglePlay}
            className="min-w-[4.5rem] rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-canvas hover:bg-gold/90 disabled:opacity-40"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            aria-label="Step forward"
            disabled={disabled || stepIndex >= lastStep}
            onClick={onStepForward}
            className="rounded-lg border border-line px-3 py-2 text-ink hover:border-gold/50 disabled:opacity-40"
          >
            ›
          </button>
        </div>

        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
            Delay
            <span className="font-mono text-ink">{speedMs}ms</span>
          </span>
          <input
            type="range"
            min={50}
            max={800}
            step={10}
            value={speedMs}
            disabled={disabled}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="accent-gold"
          />
        </label>

        <p className="font-mono text-sm text-muted">
          Step{" "}
          <span className="text-ink">
            {displayStep} / {totalSteps}
          </span>
        </p>
      </div>

      <label className="sr-only" htmlFor="trace-progress">
        Trace progress
      </label>
      <input
        id="trace-progress"
        type="range"
        min={0}
        max={lastStep}
        value={stepIndex}
        disabled={disabled || totalSteps === 0}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="w-full accent-gold"
      />
    </div>
  );
}
