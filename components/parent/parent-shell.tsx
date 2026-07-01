"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  PARENT_SECTIONS,
  parentSectionFromPathname,
} from "@/lib/routes/parent";

export function ParentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = parentSectionFromPathname(pathname);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Parent portal
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Track progress, manage notifications, and view your subscription.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <nav
          aria-label="Parent portal sections"
          className="flex gap-1 overflow-x-auto border-b border-sky-200 pb-0 lg:hidden dark:border-stone-700"
        >
          {PARENT_SECTIONS.map((section) => (
            <ParentNavLink
              key={section.id}
              section={section}
              active={activeSection === section.id}
              layout="tab"
            />
          ))}
        </nav>

        <nav
          aria-label="Parent portal sections"
          className="hidden w-52 shrink-0 lg:block"
        >
          <ul className="space-y-1">
            {PARENT_SECTIONS.map((section) => (
              <li key={section.id}>
                <ParentNavLink
                  section={section}
                  active={activeSection === section.id}
                  layout="sidebar"
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function ParentNavLink({
  section,
  active,
  layout,
}: {
  section: (typeof PARENT_SECTIONS)[number];
  active: boolean;
  layout: "tab" | "sidebar";
}) {
  return (
    <Link
      href={section.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block whitespace-nowrap text-sm font-medium transition-colors",
        layout === "tab" && "border-b-2 px-4 py-3 -mb-px",
        layout === "tab" &&
          (active
            ? "border-sky-600 text-sky-700 dark:border-stone-200 dark:text-stone-100"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-stone-500 dark:hover:text-stone-300"),
        layout === "sidebar" && "rounded-md px-3 py-2",
        layout === "sidebar" &&
          (active
            ? "bg-sky-100 text-sky-900 dark:bg-stone-800 dark:text-stone-50"
            : "text-slate-600 hover:bg-sky-50 hover:text-slate-900 dark:text-stone-400 dark:hover:bg-stone-800/80 dark:hover:text-stone-100"),
      )}
    >
      {section.label}
    </Link>
  );
}
