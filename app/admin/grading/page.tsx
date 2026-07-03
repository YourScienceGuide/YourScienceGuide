import type { Metadata } from "next";

import { AdminGradingPanel } from "@/components/admin/admin-grading-panel";

export const metadata: Metadata = {
  title: "Admin · Grading",
};

export default function AdminGradingPage() {
  return <AdminGradingPanel />;
}
