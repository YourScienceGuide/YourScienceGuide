import type { Metadata } from "next";

import { AdminCurriculumPanel } from "@/components/admin/admin-curriculum-panel";

export const metadata: Metadata = {
  title: "Admin · Curriculum",
};

export default function AdminCurriculumPage() {
  return <AdminCurriculumPanel />;
}
