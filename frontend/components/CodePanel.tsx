"use client";

import { useEffect, useRef, useState } from "react";

import {
  CODE_LANGUAGES,
  getAlgorithmCode,
  isCodeLanguage,
  type CodeLanguage,
} from "@/lib/algorithmCode";

const STORAGE_KEY = "dsa-code-lang";

interface CodePanelProps {
  algorithmId: string;
  focus: string;
}

export function CodePanel({ algorithmId, focus }: CodePanelProps) {
  const [language, setLanguage] = useState<CodeLanguage>("python");
  const listing = getAlgorithmCode(algorithmId, language);
  const activeRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isCodeLanguage(stored)) setLanguage(stored);
  }, []);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus, algorithmId, language]);

  const selectLanguage = (next: CodeLanguage) => {
    setLanguage(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  if (!listing) {
    return (
      <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-line bg-canvas/60 text-sm text-muted">
        No source listing for this algorithm.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-56 flex-col overflow-hidden rounded-xl border border-line bg-canvas/80">
      <div className="flex flex-col gap-2 border-b border-line px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-mono text-xs text-muted">
            {listing.filename}
          </p>
          <p className="shrink-0 text-[10px] uppercase tracking-wider text-muted">
            {focus ? `at ${focus}` : "ready"}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Code language"
          className="flex flex-wrap gap-1"
        >
          {CODE_LANGUAGES.map((lang) => {
            const active = lang.id === language;
            return (
              <button
                key={lang.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectLanguage(lang.id)}
                className={
                  active
                    ? "rounded-md bg-gold px-2 py-0.5 text-[11px] font-semibold text-canvas"
                    : "rounded-md px-2 py-0.5 text-[11px] font-medium text-muted hover:bg-line/60 hover:text-ink"
                }
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
      <ol className="min-h-0 flex-1 overflow-auto py-2 font-mono text-[12px] leading-6 sm:text-[13px]">
        {listing.lines.map((line, index) => {
          const active = Boolean(focus) && line.id === focus;
          return (
            <li
              key={`${listing.filename}-${index}`}
              ref={active ? activeRef : undefined}
              className={
                active
                  ? "flex bg-gold/15 text-ink"
                  : "flex text-muted hover:bg-line/30"
              }
            >
              <span
                className={
                  active
                    ? "w-10 shrink-0 pr-2 text-right text-[11px] text-gold"
                    : "w-10 shrink-0 pr-2 text-right text-[11px] text-muted/50"
                }
              >
                {index + 1}
              </span>
              <span
                className={
                  active
                    ? "min-w-0 flex-1 border-l-2 border-gold px-3 whitespace-pre"
                    : "min-w-0 flex-1 border-l-2 border-transparent px-3 whitespace-pre"
                }
              >
                {line.text.length === 0 ? " " : line.text}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
