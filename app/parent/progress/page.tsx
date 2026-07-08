import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentProgressSection } from "@/components/parent/sections/student-progress";

export const metadata: Metadata = {
  title: "Parent · Student progress",
};

export default function ParentProgressPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-600">Loading progress…</p>}>
      <StudentProgressSection />
    </Suspense>
  );
}
