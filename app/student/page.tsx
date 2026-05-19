import type { Metadata } from "next";

import { StudentHub } from "@/components/student/student-hub";

export const metadata: Metadata = {
  title: "Student",
  description: "Your courses and science curriculum.",
};

export default function StudentPage() {
  return <StudentHub />;
}
