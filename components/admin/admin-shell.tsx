"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

import { AdminActionToast } from "@/components/admin/admin-action-toast";
import { useContentStore } from "@/components/admin/content-store-provider";
import {
  AdminWorkspaceProvider,
  useAdminWorkspace,
} from "@/components/admin/admin-workspace-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMIN_TAB_ROUTES,
  adminTabFromPathname,
} from "@/lib/routes/admin";
import { rememberAdminTab } from "@/lib/admin/admin-preferences";

function AdminShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTab = adminTabFromPathname(pathname);
  const { user } = useUser();
  const { ready } = useAdminWorkspace();
  const {
    reset,
    saving,
    actionFeedback,
    clearActionFeedback,
    source,
    loading,
  } = useContentStore();

  useEffect(() => {
    if (activeTab && user?.id) {
      rememberAdminTab(user.id, activeTab);
    }
  }, [activeTab, user?.id]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            Admin
          </h1>
          <p className="max-w-2xl text-base text-slate-600 dark:text-stone-400">
            Build courses and lessons, manage the unified chapter question bank
            (assignment + extra practice), and upload videos via Mux. Content is
            stored in Supabase tables and shared across browsers and users.
          </p>
          <p className="text-xs text-slate-500 dark:text-stone-500">
            Storage:{" "}
            {loading
              ? "Loading…"
              : source === "supabase"
                ? "Supabase CMS tables (live)"
                : "Seed defaults — configure Supabase env vars to persist edits"}
          </p>
          {saving && (
            <p className="text-sm text-sky-700 dark:text-sky-300">Saving…</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          disabled={saving}
          onClick={() => {
            if (
              window.confirm(
                "Reset all admin content to defaults? This cannot be undone.",
              )
            ) {
              void reset();
            }
          }}
        >
          Reset all content
        </Button>
      </header>

      <AdminActionToast
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />

      <nav
        className="flex flex-wrap gap-2 border-b border-sky-200 pb-2 dark:border-stone-700"
        aria-label="Admin sections"
      >
        {ADMIN_TAB_ROUTES.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            aria-current={activeTab === id ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-sky-600 text-white dark:bg-stone-100 dark:text-stone-900"
                : "text-slate-600 hover:bg-sky-50 dark:text-stone-400 dark:hover:bg-stone-800",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {ready ? children : (
        <p className="text-sm text-slate-500 dark:text-stone-500">
          Restoring your last admin selection…
        </p>
      )}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminWorkspaceProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminWorkspaceProvider>
  );
}
