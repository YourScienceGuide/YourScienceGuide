import type { Metadata } from "next";

import { AdminAccessPanel } from "@/components/admin/admin-access-panel";

export const metadata: Metadata = {
  title: "Admin · Lesson access",
};

export default function AdminAccessPage() {
  return <AdminAccessPanel />;
}
