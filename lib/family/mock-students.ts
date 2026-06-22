import type { FamilyStudent } from "@/lib/family/types";

/** @deprecated Mock data replaced by Supabase-backed family students. */
export const MOCK_FAMILY_STUDENTS: FamilyStudent[] = [];

export function getFamilyStudent(id: string): FamilyStudent | undefined {
  return MOCK_FAMILY_STUDENTS.find((s) => s.id === id);
}