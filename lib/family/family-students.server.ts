import "server-only";

import { MAX_FAMILY_STUDENTS } from "@/lib/family/family-students.constants";
import {
  deriveAvatarInitials,
  deriveDisplayName,
  mapFamilyStudentRow,
  type FamilyStudentRow,
} from "@/lib/family/format-student";
import type { FamilyStudent, StudentPreferences } from "@/lib/family/types";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export type CreateFamilyStudentInput = {
  name: string;
  displayName?: string;
};

export type UpdateFamilyStudentInput = {
  name?: string;
  displayName?: string;
  preferences?: StudentPreferences;
};

export async function listFamilyStudents(
  parentClerkUserId: string,
): Promise<FamilyStudent[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("family_students")
    .select("*")
    .eq("parent_clerk_user_id", parentClerkUserId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load family students: ${error.message}`);
  }

  return (data ?? []).map((row) => mapFamilyStudentRow(row as FamilyStudentRow));
}

export async function countFamilyStudents(parentClerkUserId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = createSupabaseAdmin();
  const { count, error } = await supabase
    .from("family_students")
    .select("*", { count: "exact", head: true })
    .eq("parent_clerk_user_id", parentClerkUserId);

  if (error) {
    throw new Error(`Failed to count family students: ${error.message}`);
  }

  return count ?? 0;
}

export async function getFamilyStudentById(
  studentId: string,
): Promise<FamilyStudentRow | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("family_students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load family student: ${error.message}`);
  }

  return (data as FamilyStudentRow | null) ?? null;
}

export async function verifyFamilyStudentOwnership(
  parentClerkUserId: string,
  studentId: string,
): Promise<boolean> {
  const row = await getFamilyStudentById(studentId);
  return row?.parent_clerk_user_id === parentClerkUserId;
}

export async function createFamilyStudent(
  parentClerkUserId: string,
  input: CreateFamilyStudentInput,
): Promise<FamilyStudent> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("Student name is required");
  }

  const existing = await countFamilyStudents(parentClerkUserId);
  if (existing >= MAX_FAMILY_STUDENTS) {
    throw new Error(`You can add up to ${MAX_FAMILY_STUDENTS} students on your account`);
  }

  const displayName = (input.displayName?.trim() || deriveDisplayName(name)).slice(0, 40);
  const avatarInitials = deriveAvatarInitials(name);

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("family_students")
    .insert({
      parent_clerk_user_id: parentClerkUserId,
      name,
      display_name: displayName,
      avatar_initials: avatarInitials,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create family student: ${error?.message ?? "Unknown error"}`);
  }

  return mapFamilyStudentRow(data as FamilyStudentRow);
}

export async function updateFamilyStudent(
  parentClerkUserId: string,
  studentId: string,
  input: UpdateFamilyStudentInput,
): Promise<FamilyStudent> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const owned = await verifyFamilyStudentOwnership(parentClerkUserId, studentId);
  if (!owned) {
    throw new Error("Student not found");
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Student name is required");
    patch.name = name;
    patch.avatar_initials = deriveAvatarInitials(name);
  }

  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (!displayName) throw new Error("Display name is required");
    patch.display_name = displayName.slice(0, 40);
  }

  if (input.preferences) {
    patch.email_on_lesson_complete = input.preferences.emailOnLessonComplete;
    patch.email_on_grading_required = input.preferences.emailOnGradingRequired;
    patch.show_grade_on_dashboard = input.preferences.showGradeOnDashboard;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("family_students")
    .update(patch)
    .eq("id", studentId)
    .eq("parent_clerk_user_id", parentClerkUserId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update family student: ${error?.message ?? "Unknown error"}`);
  }

  return mapFamilyStudentRow(data as FamilyStudentRow);
}

export async function deleteFamilyStudent(
  parentClerkUserId: string,
  studentId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = createSupabaseAdmin();
  const { error, count } = await supabase
    .from("family_students")
    .delete({ count: "exact" })
    .eq("id", studentId)
    .eq("parent_clerk_user_id", parentClerkUserId);

  if (error) {
    throw new Error(`Failed to delete family student: ${error.message}`);
  }

  if (!count) {
    throw new Error("Student not found");
  }
}
