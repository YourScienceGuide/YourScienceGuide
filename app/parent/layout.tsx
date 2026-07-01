import type { Metadata } from "next";

import { ParentShell } from "@/components/parent/parent-shell";

export const metadata: Metadata = {
  title: "Parent portal",
  description: "Track student progress, notifications, and subscription.",
};

export default function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ParentShell>{children}</ParentShell>;
}
