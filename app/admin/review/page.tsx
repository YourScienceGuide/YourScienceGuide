import type { Metadata } from "next";

import { AdminReviewQuestionsPanel } from "@/components/admin/admin-review-questions-panel";

export const metadata: Metadata = {
  title: "Admin · Review questions",
};

export default function AdminReviewPage() {
  return <AdminReviewQuestionsPanel />;
}
