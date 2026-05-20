import type { ReactNode } from "react";

import { LessonAccessGate } from "@/components/student/lesson-access-gate";
import { StudentAreaGate } from "@/components/student/student-area-gate";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <LessonAccessGate>
      <StudentAreaGate>{children}</StudentAreaGate>
    </LessonAccessGate>
  );
}
