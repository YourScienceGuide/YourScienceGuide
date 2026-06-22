"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { resolveStudentScope } from "@/lib/student/student-scope";

/** Active family student id, or the guest scope constant for preview learners. */
export function useStudentScope(): string | null {
  const { isGuest } = useAuth();
  const { activeStudentId } = useActiveStudent();
  return resolveStudentScope(activeStudentId, isGuest);
}
