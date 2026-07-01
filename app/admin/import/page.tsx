import type { Metadata } from "next";

import { AdminCsvImportPanel } from "@/components/admin/admin-csv-import-panel";

export const metadata: Metadata = {
  title: "Admin · Bulk import",
};

export default function AdminImportPage() {
  return <AdminCsvImportPanel />;
}
