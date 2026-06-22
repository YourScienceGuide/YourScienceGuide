export const MAX_FAMILY_STUDENTS = 5;

export const FAMILY_STUDENTS_UPDATED_EVENT = "ysg-family-students-updated";

export function notifyFamilyStudentsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FAMILY_STUDENTS_UPDATED_EVENT));
  }
}
