export const THEME_STORAGE_KEY = "dsa-theme";
export const MODE_STORAGE_KEY = "dsa-mode";

export const THEMES = [
  { id: "gold", label: "Gold", swatch: "#e4b44c" },
  { id: "ocean", label: "Ocean", swatch: "#38bdf8" },
  { id: "forest", label: "Forest", swatch: "#7dce8a" },
  { id: "violet", label: "Violet", swatch: "#c4b5fd" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type ColorMode = "light" | "dark";

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function isColorMode(value: string): value is ColorMode {
  return value === "light" || value === "dark";
}

/** Runs before paint so the first frame matches the stored theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var r=document.documentElement;var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"gold";var m=localStorage.getItem("${MODE_STORAGE_KEY}");if(m!=="light"&&m!=="dark"){m=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(${JSON.stringify(THEMES.map((t) => t.id))}.indexOf(t)<0)t="gold";r.setAttribute("data-theme",t);r.classList.toggle("dark",m==="dark");r.style.colorScheme=m;}catch(e){}})();`;
