import type { Metadata } from "next";

import { StudentProgressSection } from "@/components/parent/sections/student-progress";

export const metadata: Metadata = {
  title: "Parent · Student progress",
};

export default function ParentProgressPage() {
  return <StudentProgressSection />;
}
