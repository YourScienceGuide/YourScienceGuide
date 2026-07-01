export const SETTINGS_SECTIONS = [
  {
    id: "appearance",
    label: "Appearance",
    href: "/settings/appearance",
    description: "Adjust how Your Science Guide looks on your device.",
  },
  {
    id: "family",
    label: "Family",
    href: "/settings/family",
    description: "Switch between learners in your family account.",
  },
  {
    id: "history",
    label: "Question history",
    href: "/settings/history",
    description: "Review assignment and extra practice attempts.",
  },
  {
    id: "account",
    label: "Account",
    href: "/settings/account",
    description: "Sign out of Your Science Guide on this device.",
  },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

const SETTINGS_SECTION_BY_SEGMENT = new Map(
  SETTINGS_SECTIONS.map((section) => [section.id, section.id] as const),
);

export function settingsSectionPath(
  section: SettingsSectionId,
): `/settings/${SettingsSectionId}` {
  return `/settings/${section}`;
}

export function settingsSectionFromPathname(
  pathname: string,
): SettingsSectionId | null {
  const segment = pathname.replace(/^\/settings\/?/, "").split("/")[0];
  if (!segment) return null;
  return SETTINGS_SECTION_BY_SEGMENT.get(segment as SettingsSectionId) ?? null;
}

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "appearance";
