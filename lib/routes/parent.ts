export const PARENT_SECTIONS = [
  { id: "students", label: "Students", href: "/parent/students" },
  { id: "progress", label: "Student progress", href: "/parent/progress" },
  { id: "notifications", label: "Notifications", href: "/parent/notifications" },
  { id: "billing", label: "Subscription", href: "/parent/billing" },
] as const;

export type ParentSectionId = (typeof PARENT_SECTIONS)[number]["id"];

const PARENT_SECTION_BY_SEGMENT = new Map(
  PARENT_SECTIONS.map((section) => [section.id, section.id] as const),
);

export function parentSectionPath(
  section: ParentSectionId,
): `/parent/${ParentSectionId}` {
  return `/parent/${section}`;
}

export function parentSectionFromPathname(
  pathname: string,
): ParentSectionId | null {
  const segment = pathname.replace(/^\/parent\/?/, "").split("/")[0];
  if (!segment) return null;
  return PARENT_SECTION_BY_SEGMENT.get(segment as ParentSectionId) ?? null;
}

export const DEFAULT_PARENT_SECTION: ParentSectionId = "students";
export const PARENT_BILLING_SECTION: ParentSectionId = "billing";
