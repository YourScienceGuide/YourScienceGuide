import type { Metadata } from "next";

import { FamilyStudentsSection } from "@/components/parent/sections/family-students";

export const metadata: Metadata = {
  title: "Parent · Students",
};

export default function ParentStudentsPage() {
  return <FamilyStudentsSection />;
}
