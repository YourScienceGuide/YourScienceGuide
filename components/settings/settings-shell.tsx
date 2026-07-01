"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  SETTINGS_SECTIONS,
  settingsSectionFromPathname,
} from "@/lib/routes/settings";

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = settingsSectionFromPathname(pathname);
  const activeMeta = SETTINGS_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Settings
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          {activeMeta?.description ??
            "Adjust how Your Science Guide looks and works on your device."}
        </p>
      </div>

      <nav
        aria-label="Settings sections"
        className="flex flex-wrap gap-2 border-b border-sky-200 pb-2 dark:border-stone-700"
      >
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            aria-current={activeSection === section.id ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeSection === section.id
                ? "bg-sky-600 text-white dark:bg-stone-100 dark:text-stone-900"
                : "text-slate-600 hover:bg-sky-50 dark:text-stone-400 dark:hover:bg-stone-800",
            )}
          >
            {section.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
