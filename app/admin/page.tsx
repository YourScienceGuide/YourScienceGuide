import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage curriculum, lessons, problems, and videos.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
