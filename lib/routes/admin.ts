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
  { id: "algorithm", label: "Algorithm", href: "/admin/algorithm" },
  { id: "review", label: "Review questions", href: "/admin/review" },
  { id: "assignment", label: "Chapter questions", href: "/admin/assignment" },
  { id: "flashcards", label: "Flashcards", href: "/admin/flashcards" },
  { id: "videos", label: "Lesson videos", href: "/admin/videos" },
  { id: "emails", label: "Parent emails", href: "/admin/emails" },
  { id: "faq", label: "Manage FAQ", href: "/admin/faq" },
  { id: "waitlist", label: "Waitlist", href: "/admin/waitlist" },
];

const TAB_BY_ID = new Map(ADMIN_TAB_ROUTES.map((tab) => [tab.id, tab] as const));

function tabs(...ids: AdminTabId[]) {
  return ids.map((id) => {
    const tab = TAB_BY_ID.get(id);
    if (!tab) throw new Error(`Unknown admin tab: ${id}`);
    return tab;
  });
}

export const ADMIN_NAV_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  items: ReadonlyArray<(typeof ADMIN_TAB_ROUTES)[number]>;
}> = [
  {
    id: "course-content",
    label: "Course Content",
    items: tabs("curriculum", "videos", "flashcards", "import"),
  },
  {
    id: "question-banks",
    label: "Question Banks",
    items: tabs("review", "assignment"),
  },
  {
    id: "grading-access",
    label: "Grading & Access",
    items: tabs("grading", "algorithm", "access"),
  },
  {
    id: "comms-support",
    label: "Comms & Support",
    items: tabs("emails", "faq", "waitlist"),
  },
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

export function adminNavGroupForTab(
  tabId: AdminTabId | null,
): (typeof ADMIN_NAV_GROUPS)[number] | null {
  if (!tabId) return null;
  return (
    ADMIN_NAV_GROUPS.find((group) =>
      group.items.some((item) => item.id === tabId),
    ) ?? null
  );
}

export const DEFAULT_ADMIN_TAB: AdminTabId = "curriculum";
