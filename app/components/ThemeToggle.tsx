"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kinneret-atlas-theme";

function resolveDarkPreference(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const dark = resolveDarkPreference();
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      disabled={isDark === null}
      aria-label={
        isDark === null
          ? "Theme"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      title={
        isDark === null ? undefined : isDark ? "Light mode" : "Dark mode"
      }
    >
      {isDark === null ? (
        <span className="theme-toggle-label" aria-hidden>
          …
        </span>
      ) : isDark ? (
        <span className="theme-toggle-label">Light</span>
      ) : (
        <span className="theme-toggle-label">Dark</span>
      )}
    </button>
  );
}
