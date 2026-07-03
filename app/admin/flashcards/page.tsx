import type { Metadata } from "next";

import { AdminFlashcardsPanel } from "@/components/admin/admin-flashcards-panel";

export const metadata: Metadata = {
  title: "Admin · Flashcards",
};

export default function AdminFlashcardsPage() {
  return <AdminFlashcardsPanel />;
}
