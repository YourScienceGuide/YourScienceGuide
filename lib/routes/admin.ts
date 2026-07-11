import type { AdminTabId } from "@/lib/admin/admin-preferences";

export const ADMIN_TAB_ROUTES: ReadonlyArray<{
  id: AdminTabId;
  label: string;
  href: `/admin/${AdminTabId}`;
}> = [
  { id: "curriculum", label: "Curriculum & lessons", href: "/admin/curriculum" },
  { id: "import", label: "Bulk import (CSV)", href: "/admin/import" },
  { id: "access", label: "Lesson access", href: "/admin/access" },
  { id: "grading", label: "Grading", href: "/admin/grading" },
  { id: "review", label: "Review questions", href: "/admin/review" },
  { id: "assignment", label: "Chapter questions", href: "/admin/assignment" },
  { id: "flashcards", label: "Flashcards", href: "/admin/flashcards" },
  { id: "videos", label: "Lesson videos", href: "/admin/videos" },
  { id: "emails", label: "Parent emails", href: "/admin/emails" },
  { id: "faq", label: "FAQ", href: "/admin/faq" },
];

const ADMIN_TAB_BY_SEGMENT = new Map(
  ADMIN_TAB_ROUTES.map((tab) => [tab.id, tab.id] as const),
);

export function adminTabPath(tab: AdminTabId): `/admin/${AdminTabId}` {
  return `/admin/${tab}`;
}

export function adminTabFromPathname(pathname: string): AdminTabId | null {
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  if (!segment) return null;
  return ADMIN_TAB_BY_SEGMENT.get(segment as AdminTabId) ?? null;
}

export const DEFAULT_ADMIN_TAB: AdminTabId = "curriculum";
