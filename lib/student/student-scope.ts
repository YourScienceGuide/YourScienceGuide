/** Scope key for guest lesson progress (not tied to a family student). */
export const GUEST_STUDENT_SCOPE = "__guest__";

export function shouldPersistStudentData(
  studentScope: string | null | undefined,
): studentScope is string {
  return Boolean(studentScope && studentScope !== GUEST_STUDENT_SCOPE);
}

export function resolveStudentScope(
  activeStudentId: string | null | undefined,
  isGuest: boolean,
): string | null {
  if (isGuest) return GUEST_STUDENT_SCOPE;
  return activeStudentId ?? null;
}
