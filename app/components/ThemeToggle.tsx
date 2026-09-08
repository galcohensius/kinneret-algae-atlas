"use client";

import { THEME_STORAGE_KEY } from "../../lib/theme";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

function SunIcon() {
  return (
    <svg {...iconProps} className="theme-toggle-icon theme-toggle-icon--sun">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...iconProps} className="theme-toggle-icon theme-toggle-icon--moon">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * Both icons are rendered and CSS shows the one matching `html.dark`, which the
 * pre-paint script in the root layout sets before hydration. No state, no
 * disabled period, identical markup on server and client.
 */
export default function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Light / dark mode"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}
