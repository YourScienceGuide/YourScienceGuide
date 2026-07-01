import type { Metadata } from "next";

import { AdminVideoPanel } from "@/components/admin/admin-video-panel";

export const metadata: Metadata = {
  title: "Admin · Lesson videos",
};

export default function AdminVideosPage() {
  return <AdminVideoPanel />;
}
