"use client";

import { useEffect, useMemo, useState } from "react";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;

  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  )?.matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle({ fullWidth }: { fullWidth?: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    getInitialTheme()
  );

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const label = useMemo(() => {
    // Desktop: kurz & clean, Mobile: Icon-only (wenn nicht fullWidth)
    return theme === "dark" ? "Dark" : "Light";
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        // kompakter System-Button
        "ui-btn ui-btn-ghost h-9 rounded-xl",
        // padding abhängig von Kontext
        fullWidth ? "w-full justify-center px-3" : "px-3",
      ].join(" ")}
      aria-label="Theme wechseln"
      title="Theme wechseln"
    >
      <span className="text-[15px] leading-none" aria-hidden>
        {theme === "dark" ? "🌙" : "☀️"}
      </span>

      {/* In der Topbar (fullWidth=false) lassen wir Text bewusst kurz */}
      <span className={fullWidth ? "" : "hidden sm:inline"}>{label}</span>
    </button>
  );
}
