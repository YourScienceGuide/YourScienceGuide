"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
}: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-1">
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-900 dark:text-stone-50"
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-slate-600 dark:text-stone-400">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-stone-500 dark:focus-visible:ring-offset-stone-900",
          checked
            ? "border-sky-600 bg-sky-600 dark:border-stone-300 dark:bg-stone-200"
            : "border-sky-200 bg-sky-100 dark:border-stone-600 dark:bg-stone-700",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
