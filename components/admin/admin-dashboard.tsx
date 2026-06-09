"use client";

import { useState } from "react";

import { AdminAlcumusPanel } from "@/components/admin/admin-alcumus-panel";
import { AdminAssignmentPanel } from "@/components/admin/admin-assignment-panel";
import { AdminCsvImportPanel } from "@/components/admin/admin-csv-import-panel";
import { AdminCurriculumPanel } from "@/components/admin/admin-curriculum-panel";
import { AdminVideoPanel } from "@/components/admin/admin-video-panel";
import { useContentStore } from "@/components/admin/use-content-store";
import { loadContentStore, resetContentStore } from "@/lib/admin/content-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "curriculum", label: "Curriculum & lessons" },
  { id: "import", label: "Bulk import (CSV)" },
  { id: "assignment", label: "Assignment questions" },
  { id: "alcumus", label: "Extra practice (Alcumus)" },
  { id: "videos", label: "Lesson videos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("curriculum");
  const { persist } = useContentStore();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            Admin
          </h1>
          <p className="max-w-2xl text-base text-slate-600 dark:text-stone-400">
            Build courses and lessons, edit assignment and Alcumus problems, and
            upload videos via Mux. Lesson metadata is saved in this browser.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => {
            if (
              window.confirm(
                "Reset all admin content to defaults? This cannot be undone.",
              )
            ) {
              resetContentStore();
              persist(loadContentStore());
            }
          }}
        >
          Reset all content
        </Button>
      </header>

      <nav
        className="flex flex-wrap gap-2 border-b border-sky-200 pb-2 dark:border-stone-700"
        aria-label="Admin sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-sky-600 text-white dark:bg-stone-100 dark:text-stone-900"
                : "text-slate-600 hover:bg-sky-50 dark:text-stone-400 dark:hover:bg-stone-800",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "curriculum" && <AdminCurriculumPanel />}
      {tab === "import" && <AdminCsvImportPanel />}
      {tab === "assignment" && <AdminAssignmentPanel />}
      {tab === "alcumus" && <AdminAlcumusPanel />}
      {tab === "videos" && <AdminVideoPanel />}
    </div>
  );
}
