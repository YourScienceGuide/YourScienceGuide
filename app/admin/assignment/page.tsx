import type { Metadata } from "next";

import { AdminAssignmentPanel } from "@/components/admin/admin-assignment-panel";

export const metadata: Metadata = {
  title: "Admin · Chapter questions",
};

export default function AdminAssignmentPage() {
  return <AdminAssignmentPanel />;
}
