import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeStore } from "../../helpers/factories";
import { installFetchMock } from "../../helpers/fetch-mock";
import {
  persistAdminContent,
  resetAdminContent,
} from "@/lib/admin/persist-admin-content-client";
import {
  recordFlashcardStudyEventClient,
  saveFlashcardDefinitionClient,
} from "@/lib/student/flashcard-progress-client";
import { saveParentDailyEmailTemplate } from "@/lib/admin/parent-daily-email-client";
import {
  submitLongAnswer,
  syncLessonGrade,
} from "@/lib/student/lesson-grades-client";
import { gradeSubmission } from "@/lib/parent/student-progress-client";
import {
  createFamilyStudent,
  updateFamilyStudent,
} from "@/lib/family/family-students-client";

describe("client save error handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("persistAdminContent", () => {
    it("maps network failures to offline guidance", async () => {
      installFetchMock({ networkError: new Error("Failed to fetch") });
      const result = await persistAdminContent(makeStore());
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("No connection");
      expect(result.tips.length).toBeGreaterThan(0);
    });

    it("maps API save failures to friendly messages", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to save content" },
      });
      const result = await persistAdminContent(makeStore());
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("We couldn't save your changes.");
    });

    it("returns saved store on success", async () => {
      const store = makeStore();
      installFetchMock({ ok: true, json: store });
      const result = await persistAdminContent(store);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.store.version).toBe(store.version);
    });

    it("requests structure scope when saving curriculum structure", async () => {
      const store = makeStore();
      const fetchMock = installFetchMock({ ok: true, json: store });
      await persistAdminContent(store, { scope: "structure" });
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/content?scope=structure",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("requests videos scope when saving video metadata", async () => {
      const store = makeStore();
      const fetchMock = installFetchMock({ ok: true, json: store });
      await persistAdminContent(store, { scope: "videos" });
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/content?scope=videos",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  describe("resetAdminContent", () => {
    it("maps network failures when resetting content", async () => {
      installFetchMock({ networkError: new Error("NetworkError") });
      const result = await resetAdminContent();
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("No connection");
    });

    it("maps reset API failures to friendly messages", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to reset content" },
      });
      const result = await resetAdminContent();
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("We couldn't save your changes.");
    });
  });

  describe("flashcard-progress-client", () => {
    const baseInput = {
      familyStudentId: "student-1",
      courseId: "biology-year-1",
      lessonId: "lesson-a",
      cardId: "card-1",
      frontText: "Mitochondria",
    };

    it("throws server error message when study event save fails", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to save flashcard progress" },
      });
      await expect(
        recordFlashcardStudyEventClient({ ...baseInput, isCorrect: true }),
      ).rejects.toThrow("Failed to save flashcard progress");
    });

    it("throws default message when study event response has no body", async () => {
      installFetchMock({ ok: false, status: 500, jsonError: true });
      await expect(
        recordFlashcardStudyEventClient({ ...baseInput, isCorrect: false }),
      ).rejects.toThrow("Failed to save flashcard progress");
    });

    it("propagates network failures from definition save", async () => {
      installFetchMock({ networkError: new Error("Failed to fetch") });
      await expect(
        saveFlashcardDefinitionClient({
          ...baseInput,
          definition: "Powerhouse of the cell",
        }),
      ).rejects.toThrow("Failed to fetch");
    });
  });

  describe("parent-daily-email-client", () => {
    it("throws server error when template save fails", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to save email template" },
      });
      await expect(
        saveParentDailyEmailTemplate({
          subject: "Daily update",
          body: "Hello {{studentName}}",
          enabled: true,
        }),
      ).rejects.toThrow("Failed to save email template");
    });

    it("throws default message when template save response is unreadable", async () => {
      installFetchMock({ ok: false, status: 503, jsonError: true });
      await expect(
        saveParentDailyEmailTemplate({
          subject: "Daily update",
          body: "Hello",
          enabled: true,
        }),
      ).rejects.toThrow("Failed to save email template");
    });
  });

  describe("lesson-grades-client", () => {
    const gradePayload = {
      familyStudentId: "student-1",
      courseId: "biology-year-1",
      lessonId: "lesson-a",
      earnedPoints: 8,
      possiblePoints: 10,
      percent: 80,
      problemsSolved: 4,
      graduated: false,
      scoreBreakdown: {},
      phaseProgress: {},
    };

    it("throws server error when lesson grade sync fails", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to save lesson grade" },
      });
      await expect(syncLessonGrade(gradePayload)).rejects.toThrow(
        "Failed to save lesson grade",
      );
    });

    it("throws default message when long answer submission fails", async () => {
      installFetchMock({ ok: false, status: 500, json: {} });
      await expect(
        submitLongAnswer({
          familyStudentId: "student-1",
          courseId: "biology-year-1",
          lessonId: "lesson-a",
          questionId: "q1",
          promptExcerpt: "Explain photosynthesis",
          answerText: "Plants use sunlight.",
          maxPoints: 10,
        }),
      ).rejects.toThrow("Failed to submit answer");
    });

    it("propagates network failures from grade sync", async () => {
      installFetchMock({ networkError: new Error("Failed to fetch") });
      await expect(syncLessonGrade(gradePayload)).rejects.toThrow("Failed to fetch");
    });
  });

  describe("student-progress-client", () => {
    it("throws server error when parent grading fails", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to grade submission" },
      });
      await expect(
        gradeSubmission({
          submissionId: "sub-1",
          parentScore: 8,
          parentFeedback: "Good work",
        }),
      ).rejects.toThrow("Failed to grade submission");
    });

    it("uses fallback message when grade response omits error text", async () => {
      installFetchMock({ ok: false, status: 500, json: {} });
      await expect(
        gradeSubmission({ submissionId: "sub-1", parentScore: 7 }),
      ).rejects.toThrow("Failed to grade submission");
    });
  });

  describe("family-students-client", () => {
    it("throws server error when create student fails", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to create family student: timeout" },
      });
      await expect(createFamilyStudent({ name: "Alex" })).rejects.toThrow(
        "Failed to create family student: timeout",
      );
    });

    it("throws default message when create response has no error body", async () => {
      installFetchMock({ ok: false, status: 500, jsonError: true });
      await expect(createFamilyStudent({ name: "Alex" })).rejects.toThrow(
        "Failed to add student",
      );
    });

    it("throws server error when update student fails", async () => {
      installFetchMock({
        ok: false,
        status: 500,
        json: { error: "Failed to update family student: db down" },
      });
      await expect(
        updateFamilyStudent("student-1", { displayName: "AJ" }),
      ).rejects.toThrow("Failed to update family student: db down");
    });

    it("propagates network failures from student create", async () => {
      installFetchMock({ networkError: new Error("Failed to fetch") });
      await expect(createFamilyStudent({ name: "Alex" })).rejects.toThrow(
        "Failed to fetch",
      );
    });
  });
});
