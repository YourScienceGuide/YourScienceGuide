export const ACTIVE_STUDENT_KEY = "ysg-active-student-id";

export function readActiveStudentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_STUDENT_KEY);
}

export function writeActiveStudentId(studentId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_STUDENT_KEY, studentId);
}

export function clearActiveStudentId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_STUDENT_KEY);
}
