import type { ReactNode } from "react";

import { StudentAreaGate } from "@/components/student/student-area-gate";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentAreaGate>{children}</StudentAreaGate>;
}
