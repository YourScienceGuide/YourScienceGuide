"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function DarkModeToggle() {
  const { theme, toggleDarkMode } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={toggleDarkMode}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-stone-500 dark:focus-visible:ring-offset-stone-900",
        isDark
          ? "border-stone-600 bg-stone-700"
          : "border-sky-200 bg-sky-100",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform",
          isDark ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
