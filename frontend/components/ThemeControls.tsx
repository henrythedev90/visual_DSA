"use client";

import { useEffect, useState } from "react";

import {
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  THEMES,
  type ColorMode,
  type ThemeId,
} from "@/lib/theme";

function apply(theme: ThemeId, mode: ColorMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.localStorage.setItem(MODE_STORAGE_KEY, mode);
}

export function ThemeControls() {
  const [theme, setTheme] = useState<ThemeId>("gold");
  const [mode, setMode] = useState<ColorMode>("dark");

  useEffect(() => {
    const storedTheme = document.documentElement.dataset.theme;
    const dark = document.documentElement.classList.contains("dark");
    if (storedTheme && THEMES.some((item) => item.id === storedTheme)) {
      setTheme(storedTheme as ThemeId);
    }
    setMode(dark ? "dark" : "light");
  }, []);

  const selectTheme = (next: ThemeId) => {
    setTheme(next);
    apply(next, mode);
  };

  const toggleMode = () => {
    const next: ColorMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    apply(theme, next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Color theme"
        className="flex items-center gap-1 rounded-xl border border-line bg-canvas/70 p-1"
      >
        {THEMES.map((item) => {
          const active = item.id === theme;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={item.label}
              onClick={() => selectTheme(item.id)}
              className={
                active
                  ? "rounded-lg px-2 py-1 text-[11px] font-semibold text-ink ring-1 ring-gold"
                  : "rounded-lg px-2 py-1 text-[11px] font-medium text-muted hover:text-ink"
              }
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: item.swatch }}
              />
              {item.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="rounded-xl border border-line bg-canvas/70 px-3 py-1.5 text-[11px] font-semibold text-ink hover:border-gold/50"
      >
        {mode === "dark" ? "Light" : "Dark"}
      </button>
    </div>
  );
}
