import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  requireAuthenticated: vi.fn(),
  requireFamilyStudentAccess: vi.fn(),
}));

const supabaseMocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(() => true),
}));

const serverMocks = vi.hoisted(() => ({
  saveContentStoreToDatabase: vi.fn(),
  resetContentStoreInDatabase: vi.fn(),
  upsertLessonGrade: vi.fn(),
  createLongAnswerSubmission: vi.fn(),
  gradeLongAnswerSubmission: vi.fn(),
  recordFlashcardStudyEvent: vi.fn(),
  upsertFlashcardDefinition: vi.fn(),
  insertQuestionAttempt: vi.fn(),
  saveParentDailyEmailTemplate: vi.fn(),
  getFamilyStudentById: vi.fn(),
  getSubmissionById: vi.fn(),
  createFamilyStudent: vi.fn(),
  updateFamilyStudent: vi.fn(),
  deleteFamilyStudent: vi.fn(),
  uploadTextbookCover: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: authMocks.requireAdmin,
}));

vi.mock("@/lib/auth/require-authenticated", () => ({
  requireAuthenticated: authMocks.requireAuthenticated,
  requireFamilyStudentAccess: authMocks.requireFamilyStudentAccess,
}));

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: supabaseMocks.isSupabaseConfigured,
}));

vi.mock("@/lib/admin/content-store.server", () => ({
  saveContentStoreToDatabase: serverMocks.saveContentStoreToDatabase,
  resetContentStoreInDatabase: serverMocks.resetContentStoreInDatabase,
  loadContentStoreFromDatabase: vi.fn(),
}));

vi.mock("@/lib/student/lesson-grades.server", () => ({
  upsertLessonGrade: serverMocks.upsertLessonGrade,
  createLongAnswerSubmission: serverMocks.createLongAnswerSubmission,
  gradeLongAnswerSubmission: serverMocks.gradeLongAnswerSubmission,
  getSubmissionById: serverMocks.getSubmissionById,
}));

vi.mock("@/lib/student/flashcard-progress.server", () => ({
  recordFlashcardStudyEvent: serverMocks.recordFlashcardStudyEvent,
  upsertFlashcardDefinition: serverMocks.upsertFlashcardDefinition,
}));

vi.mock("@/lib/student/question-history.server", () => ({
  insertQuestionAttempt: serverMocks.insertQuestionAttempt,
  listQuestionAttempts: vi.fn(),
  getQuestionAttemptSummary: vi.fn(),
  listQuestionAttemptsForParent: vi.fn(),
  getQuestionAttemptSummaryForParent: vi.fn(),
}));

vi.mock("@/lib/email/parent-daily-email-template.server", () => ({
  loadParentDailyEmailTemplate: vi.fn(),
  saveParentDailyEmailTemplate: serverMocks.saveParentDailyEmailTemplate,
}));

vi.mock("@/lib/email/send-email", () => ({
  getEmailFromAddress: vi.fn(() => "noreply@example.com"),
  isEmailSendingConfigured: vi.fn(() => false),
}));

vi.mock("@/lib/family/family-students.server", () => ({
  getFamilyStudentById: serverMocks.getFamilyStudentById,
  createFamilyStudent: serverMocks.createFamilyStudent,
  updateFamilyStudent: serverMocks.updateFamilyStudent,
  deleteFamilyStudent: serverMocks.deleteFamilyStudent,
}));

vi.mock("@/lib/cms/textbook-covers.server", () => ({
  uploadTextbookCover: serverMocks.uploadTextbookCover,
}));

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API save error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.isSupabaseConfigured.mockReturnValue(true);
    authMocks.requireAdmin.mockResolvedValue({ ok: true, userId: "admin-1" });
    authMocks.requireAuthenticated.mockResolvedValue({ ok: true, userId: "parent-1" });
    authMocks.requireFamilyStudentAccess.mockResolvedValue({ ok: true, userId: "parent-1" });
    serverMocks.getFamilyStudentById.mockResolvedValue({
      parent_clerk_user_id: "parent-1",
    });
    serverMocks.getSubmissionById.mockResolvedValue({
      id: "sub-1",
      familyStudentId: "student-1",
    });
  });

  describe("PUT /api/admin/content", () => {
    it("returns 503 when Supabase is not configured", async () => {
      supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
      const { PUT } = await import("@/app/api/admin/content/route");
      const response = await PUT(jsonRequest("http://localhost/api/admin/content", {}));
      expect(response.status).toBe(503);
      expect((await response.json()).error).toMatch(/not available/i);
    });

    it("returns 500 when database save throws", async () => {
      serverMocks.saveContentStoreToDatabase.mockRejectedValue(
        new Error("Failed to save course course-a: timeout"),
      );
      const { PUT } = await import("@/app/api/admin/content/route");
      const response = await PUT(
        jsonRequest("http://localhost/api/admin/content", { version: 3, courses: [] }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save content");
    });
  });

  describe("POST /api/admin/content?action=reset", () => {
    it("returns 500 when reset throws", async () => {
      serverMocks.resetContentStoreInDatabase.mockRejectedValue(
        new Error("Failed to reset CMS courses: db down"),
      );
      const { POST } = await import("@/app/api/admin/content/route");
      const response = await POST(
        new Request("http://localhost/api/admin/content?action=reset", { method: "POST" }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to reset content");
    });
  });

  describe("POST /api/student/lesson-grade", () => {
    it("returns 500 when grade upsert fails", async () => {
      serverMocks.upsertLessonGrade.mockRejectedValue(
        new Error("Failed to save lesson grade: timeout"),
      );
      const { POST } = await import("@/app/api/student/lesson-grade/route");
      const response = await POST(
        jsonRequest("http://localhost/api/student/lesson-grade", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
        }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save lesson grade");
    });
  });

  describe("POST /api/student/long-answer-submissions", () => {
    it("returns 503 when Supabase is unavailable", async () => {
      supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
      const { POST } = await import("@/app/api/student/long-answer-submissions/route");
      const response = await POST(
        jsonRequest("http://localhost/api/student/long-answer-submissions", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          questionId: "q1",
          answerText: "Answer",
        }),
      );
      expect(response.status).toBe(503);
    });

    it("returns 500 when submission insert fails", async () => {
      serverMocks.createLongAnswerSubmission.mockRejectedValue(
        new Error("Failed to save submission: disk full"),
      );
      const { POST } = await import("@/app/api/student/long-answer-submissions/route");
      const response = await POST(
        jsonRequest("http://localhost/api/student/long-answer-submissions", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          questionId: "q1",
          answerText: "Answer",
        }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save submission");
    });
  });

  describe("POST /api/student/question-attempts", () => {
    it("returns 500 when attempt insert fails", async () => {
      serverMocks.insertQuestionAttempt.mockRejectedValue(
        new Error("Failed to save question attempt: constraint"),
      );
      const { POST } = await import("@/app/api/student/question-attempts/route");
      const response = await POST(
        jsonRequest("http://localhost/api/student/question-attempts", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          questionId: "q1",
          activity: "assignment",
          questionType: "multiple-choice",
          isCorrect: true,
        }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save question attempt");
    });
  });

  describe("POST /api/student/flashcard-progress", () => {
    it("returns 500 when study event save fails", async () => {
      serverMocks.recordFlashcardStudyEvent.mockRejectedValue(
        new Error("Failed to record flashcard study event: db down"),
      );
      const { POST } = await import("@/app/api/student/flashcard-progress/route");
      const response = await POST(
        jsonRequest("http://localhost/api/student/flashcard-progress", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          cardId: "card-1",
          eventType: "study",
          isCorrect: true,
        }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save flashcard progress");
    });

    it("returns 500 when definition save fails", async () => {
      serverMocks.upsertFlashcardDefinition.mockRejectedValue(
        new Error("Failed to save flashcard definition: write failed"),
      );
      const { POST } = await import("@/app/api/student/flashcard-progress/route");
      const response = await POST(
        jsonRequest("http://localhost/api/student/flashcard-progress", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          cardId: "card-1",
          eventType: "definition",
          definition: "Meaning",
        }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save flashcard progress");
    });
  });

  describe("PUT /api/admin/parent-daily-email", () => {
    it("returns 500 when template save fails", async () => {
      serverMocks.saveParentDailyEmailTemplate.mockRejectedValue(
        new Error("Failed to save parent daily email template: relation missing"),
      );
      const { PUT } = await import("@/app/api/admin/parent-daily-email/route");
      const response = await PUT(
        jsonRequest(
          "http://localhost/api/admin/parent-daily-email",
          { subject: "Hello", body: "Body", enabled: true },
          "PUT",
        ),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to save email template");
    });
  });

  describe("POST /api/parent/grade-submission", () => {
    it("returns 503 when Supabase is unavailable", async () => {
      supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
      const { POST } = await import("@/app/api/parent/grade-submission/route");
      const response = await POST(
        jsonRequest("http://localhost/api/parent/grade-submission", {
          submissionId: "sub-1",
          parentScore: 8,
        }),
      );
      expect(response.status).toBe(503);
    });

    it("returns 500 when grading update fails", async () => {
      serverMocks.gradeLongAnswerSubmission.mockRejectedValue(
        new Error("Failed to grade submission: row missing"),
      );
      const { POST } = await import("@/app/api/parent/grade-submission/route");
      const response = await POST(
        jsonRequest("http://localhost/api/parent/grade-submission", {
          submissionId: "sub-1",
          parentScore: 8,
        }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe("Failed to grade submission");
    });
  });

  describe("POST /api/family/students", () => {
    it("returns 503 when Supabase is unavailable", async () => {
      supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
      const { POST } = await import("@/app/api/family/students/route");
      const response = await POST(
        jsonRequest("http://localhost/api/family/students", { name: "Alex" }),
      );
      expect(response.status).toBe(503);
    });

    it("returns 500 when create student fails", async () => {
      serverMocks.createFamilyStudent.mockRejectedValue(
        new Error("Failed to create family student: timeout"),
      );
      const { POST } = await import("@/app/api/family/students/route");
      const response = await POST(
        jsonRequest("http://localhost/api/family/students", { name: "Alex" }),
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe(
        "Failed to create family student: timeout",
      );
    });
  });

  describe("PATCH /api/family/students/[studentId]", () => {
    it("returns 500 when update fails", async () => {
      serverMocks.updateFamilyStudent.mockRejectedValue(
        new Error("Failed to update family student: db down"),
      );
      const { PATCH } = await import("@/app/api/family/students/[studentId]/route");
      const response = await PATCH(
        jsonRequest("http://localhost/api/family/students/student-1", {
          displayName: "AJ",
        }),
        { params: Promise.resolve({ studentId: "student-1" }) },
      );
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe(
        "Failed to update family student: db down",
      );
    });
  });

  describe("POST /api/admin/textbook-cover", () => {
    it("returns 500 when cover upload fails", async () => {
      serverMocks.uploadTextbookCover.mockRejectedValue(
        new Error("Failed to upload cover: storage unavailable"),
      );
      const { POST } = await import("@/app/api/admin/textbook-cover/route");
      const file = new File(["cover"], "cover.png", { type: "image/png" });
      const request = {
        formData: async () => {
          const form = new FormData();
          form.set("courseId", "biology-year-1");
          form.set("file", file);
          return form;
        },
      } as Request;
      const response = await POST(request);
      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe(
        "Failed to upload cover: storage unavailable",
      );
    });
  });
});
