import type { Metadata } from "next";

import { SettingsShell } from "@/components/settings/settings-shell";

export const metadata: Metadata = {
  title: "Settings",
  description: "Appearance, family, and account settings.",
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SettingsShell>{children}</SettingsShell>;
}
