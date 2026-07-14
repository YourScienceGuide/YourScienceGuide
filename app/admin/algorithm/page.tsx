import type { Metadata } from "next";

import { AdminAlgorithmPanel } from "@/components/admin/admin-algorithm-panel";

export const metadata: Metadata = {
  title: "Admin · Assignment algorithm",
};

export default function AdminAlgorithmPage() {
  return <AdminAlgorithmPanel />;
}
