import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";
import { notifyFamilyStudentsUpdated } from "@/lib/family/family-students.constants";
export type FamilyStudentsResponse = {
  students: FamilyStudent[];
  source: "supabase" | "unavailable";
  maxStudents: number;
};

export async function fetchFamilyStudents(): Promise<FamilyStudentsResponse> {
  const res = await fetch("/api/family/students", { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to load students");
  }

  return (await res.json()) as FamilyStudentsResponse;
}
export async function createFamilyStudent(input: {
  name: string;
  displayName?: string;
}): Promise<FamilyStudent> {
  const res = await fetch("/api/family/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to add student");
  }

  const data = (await res.json()) as { student: FamilyStudent };
  notifyFamilyStudentsUpdated();
  return data.student;
}

export async function updateFamilyStudent(
  studentId: string,
  input: {
    name?: string;
    displayName?: string;
    preferences?: StudentPreferences;
  },
): Promise<FamilyStudent> {
  const res = await fetch(`/api/family/students/${studentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update student");
  }

  const data = (await res.json()) as { student: FamilyStudent };
  notifyFamilyStudentsUpdated();
  return data.student;
}

export async function deleteFamilyStudent(studentId: string): Promise<void> {
  const res = await fetch(`/api/family/students/${studentId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to remove student");
  }

  notifyFamilyStudentsUpdated();
}
