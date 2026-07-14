"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { AdminActionToast } from "@/components/admin/admin-action-toast";
import { AdminNav } from "@/components/admin/admin-nav";
import { useContentStore } from "@/components/admin/content-store-provider";
import {
  AdminWorkspaceProvider,
  useAdminWorkspace,
} from "@/components/admin/admin-workspace-provider";
import { Button } from "@/components/ui/button";
import { adminTabFromPathname } from "@/lib/routes/admin";
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
            (assignment + extra practice), and upload lesson videos. Changes are
            saved for all students and parents using the site.
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

      <AdminNav />

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
