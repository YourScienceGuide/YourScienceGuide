import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminContentStore } from "@/lib/admin/content-store";
import { createSupabaseMock } from "../../helpers/supabase-mock";

vi.mock("server-only", () => ({}));

const supabaseMocks = vi.hoisted(() => ({
  createSupabaseAdmin: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdmin: supabaseMocks.createSupabaseAdmin,
  isSupabaseConfigured: supabaseMocks.isSupabaseConfigured,
}));

vi.mock("@/lib/cms/textbook-covers.server", () => ({
  resolveTextbookCoverUrl: vi.fn(async (_courseId: string, src: string) => src),
}));

function minimalStore(overrides: Partial<AdminContentStore> = {}): AdminContentStore {
  return {
    version: 3,
    courses: [
      {
        id: "course-a",
        title: "Course A",
        subject: "Science",
        description: "Test course",
        lessons: [],
      },
    ],
    questionBank: {},
    videos: {},
    ...overrides,
  };
}

describe("server save error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.isSupabaseConfigured.mockReturnValue(true);
    supabaseMocks.createSupabaseAdmin.mockReturnValue(createSupabaseMock());
  });

  describe("saveCmsFromStore", () => {
    it("throws when course upsert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "courses.upsert", message: "connection refused" }],
        }),
      );

      const { saveCmsFromStore } = await import("@/lib/cms/save-cms");
      await expect(saveCmsFromStore(minimalStore())).rejects.toThrow(
        "Failed to save course course-a: connection refused",
      );
    });

    it("throws when chapter question insert fails", async () => {
      const store = minimalStore({
        courses: [
          {
            id: "course-a",
            title: "Course A",
            subject: "Science",
            description: "Test course",
            lessons: [
              {
                id: "lesson-a",
                chapterId: "chapter-1",
                chapterTitle: "Chapter 1",
                title: "Lesson A",
                description: "Lesson",
                order: 1,
                chapter: 1,
                section: 1,
              },
            ],
          },
        ],
        questionBank: {
          "course-a/lesson-a": [
            {
              type: "multiple-choice",
              id: "q1",
              difficulty: 1,
              prompt: "Pick one",
              options: ["A", "B"],
              correctIndex: 0,
            },
          ],
        },
      });

      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [
            { key: "assignment_questions.insert", message: "duplicate key value" },
          ],
        }),
      );

      const { saveCmsFromStore } = await import("@/lib/cms/save-cms");
      await expect(saveCmsFromStore(store)).rejects.toThrow(
        "Failed to save chapter questions: duplicate key value",
      );
    });

    it("throws when grading config upsert fails", async () => {
      const store = minimalStore({
        gradingConfigByCourse: {
          "course-a": {
            reviewCount: 3,
            reviewPointsEach: 1,
            mcBankSize: 5,
            mcTargetCorrect: 3,
            mcPointsEach: 1,
            fibCount: 2,
            fibPointsEach: 1,
            extraCount: 0,
            extraPointsEach: 0,
            freeResponseCount: 1,
            freeResponsePoints: 5,
            defaultGraduationProblemCount: 10,
          },
        },
      });

      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [
            { key: "course_grading_config.upsert", message: "permission denied" },
          ],
        }),
      );

      const { saveCmsFromStore } = await import("@/lib/cms/save-cms");
      await expect(saveCmsFromStore(store)).rejects.toThrow(
        "Failed to save grading config for course-a: permission denied",
      );
    });

    it("skips rewriting question banks when scope is structure", async () => {
      const store = minimalStore({
        courses: [
          {
            id: "course-a",
            title: "Course A",
            subject: "Science",
            description: "Test course",
            lessons: [
              {
                id: "lesson-a",
                chapterId: "chapter-1",
                chapterTitle: "Chapter 1",
                title: "Lesson A",
                description: "Lesson",
                order: 1,
                chapter: 1,
                section: 1,
              },
            ],
          },
        ],
        questionBank: {
          "course-a/lesson-a": [
            {
              type: "multiple-choice",
              id: "q1",
              difficulty: 1,
              prompt: "Pick one",
              options: ["A", "B"],
              correctIndex: 0,
            },
          ],
        },
      });

      const mock = createSupabaseMock({
        failures: [
          { key: "assignment_questions.delete", message: "should not run" },
        ],
      });
      supabaseMocks.createSupabaseAdmin.mockReturnValue(mock);

      const { saveCmsFromStore } = await import("@/lib/cms/save-cms");
      await expect(
        saveCmsFromStore(store, { scope: "structure" }),
      ).resolves.toBeUndefined();
    });

    it("upserts video metadata when scope is videos", async () => {
      const store = minimalStore({
        courses: [
          {
            id: "course-a",
            title: "Course A",
            subject: "Science",
            description: "Test course",
            lessons: [
              {
                id: "lesson-a",
                chapterId: "chapter-1",
                chapterTitle: "Chapter 1",
                title: "Lesson A",
                description: "Lesson",
                order: 1,
                chapter: 1,
                section: 1,
              },
            ],
          },
        ],
        videos: {
          "course-a/lesson-a": {
            title: "Custom title",
            description: "Custom description",
          },
        },
      });

      const mock = createSupabaseMock({
        failures: [
          { key: "assignment_questions.delete", message: "should not run" },
        ],
      });
      supabaseMocks.createSupabaseAdmin.mockReturnValue(mock);

      const { saveCmsFromStore } = await import("@/lib/cms/save-cms");
      await expect(
        saveCmsFromStore(store, { scope: "videos" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("upsertLessonGrade", () => {
    it("throws when database upsert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "lesson_grades.upsert", message: "timeout" }],
        }),
      );

      const { upsertLessonGrade } = await import("@/lib/student/lesson-grades.server");
      await expect(
        upsertLessonGrade({
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          earnedPoints: 1,
          possiblePoints: 10,
          percent: 10,
          problemsSolved: 1,
          graduated: false,
          scoreBreakdown: {},
          phaseProgress: {},
        }),
      ).rejects.toThrow("Failed to save lesson grade: timeout");
    });
  });

  describe("createLongAnswerSubmission", () => {
    it("throws when insert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "long_answer_submissions.insert", message: "disk full" }],
        }),
      );

      const { createLongAnswerSubmission } = await import(
        "@/lib/student/lesson-grades.server"
      );
      await expect(
        createLongAnswerSubmission({
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          questionId: "q1",
          promptExcerpt: "Explain",
          answerText: "Because",
          maxPoints: 10,
        }),
      ).rejects.toThrow("Failed to save submission: disk full");
    });
  });

  describe("gradeLongAnswerSubmission", () => {
    it("throws when update fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "long_answer_submissions.update", message: "row missing" }],
        }),
      );

      const { gradeLongAnswerSubmission } = await import(
        "@/lib/student/lesson-grades.server"
      );
      await expect(
        gradeLongAnswerSubmission({
          submissionId: "sub-1",
          parentScore: 8,
        }),
      ).rejects.toThrow("Failed to grade submission: row missing");
    });
  });

  describe("flashcard-progress.server", () => {
    it("throws when study event insert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "flashcard_study_events.insert", message: "db down" }],
        }),
      );

      const { recordFlashcardStudyEvent } = await import(
        "@/lib/student/flashcard-progress.server"
      );
      await expect(
        recordFlashcardStudyEvent({
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          cardId: "card-1",
          frontText: "Term",
          isCorrect: true,
        }),
      ).rejects.toThrow("Failed to record flashcard study event: db down");
    });

    it("throws when definition upsert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [
            { key: "flashcard_student_definitions.upsert", message: "write failed" },
          ],
        }),
      );

      const { upsertFlashcardDefinition } = await import(
        "@/lib/student/flashcard-progress.server"
      );
      await expect(
        upsertFlashcardDefinition({
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          cardId: "card-1",
          frontText: "Term",
          definition: "Meaning",
        }),
      ).rejects.toThrow("Failed to save flashcard definition: write failed");
    });
  });

  describe("insertQuestionAttempt", () => {
    it("throws when insert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "question_attempts.insert", message: "constraint violation" }],
        }),
      );

      const { insertQuestionAttempt } = await import(
        "@/lib/student/question-history.server"
      );
      await expect(
        insertQuestionAttempt("parent-1", "student-1", {
          familyStudentId: "student-1",
          courseId: "course-a",
          lessonId: "lesson-a",
          questionId: "q1",
          activity: "assignment",
          questionType: "multiple-choice",
          promptExcerpt: "Pick",
          isCorrect: true,
        }),
      ).rejects.toThrow("Failed to save question attempt: constraint violation");
    });
  });

  describe("saveParentDailyEmailTemplate", () => {
    it("throws when template upsert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [
            { key: "parent_daily_email_template.upsert", message: "relation missing" },
          ],
        }),
      );

      const { saveParentDailyEmailTemplate } = await import(
        "@/lib/email/parent-daily-email-template.server"
      );
      await expect(
        saveParentDailyEmailTemplate({
          subject: "Daily digest",
          body: "Hello",
          enabled: true,
        }),
      ).rejects.toThrow(
        "Failed to save parent daily email template: relation missing",
      );
    });

    it("throws when database is not configured", async () => {
      supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
      const { saveParentDailyEmailTemplate } = await import(
        "@/lib/email/parent-daily-email-template.server"
      );
      await expect(
        saveParentDailyEmailTemplate({
          subject: "Daily digest",
          body: "Hello",
          enabled: true,
        }),
      ).rejects.toThrow("Database is not configured.");
    });
  });

  describe("saveContentStoreToDatabase", () => {
    it("throws when Supabase is not configured", async () => {
      supabaseMocks.isSupabaseConfigured.mockReturnValue(false);
      const { saveContentStoreToDatabase } = await import(
        "@/lib/admin/content-store.server"
      );
      await expect(saveContentStoreToDatabase(minimalStore())).rejects.toThrow(
        "Supabase is not configured",
      );
    });

    it("propagates CMS save failures", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "courses.upsert", message: "network unreachable" }],
        }),
      );

      const { saveContentStoreToDatabase } = await import(
        "@/lib/admin/content-store.server"
      );
      await expect(saveContentStoreToDatabase(minimalStore())).rejects.toThrow(
        "Failed to save course course-a: network unreachable",
      );
    });
  });

  describe("family-students.server", () => {
    it("throws when create student insert fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "family_students.insert", message: "timeout" }],
          singleRow: {
            family_students: {
              id: "student-1",
              parent_clerk_user_id: "parent-1",
              name: "Alex",
              display_name: "Alex",
              preferences: {},
              created_at: new Date().toISOString(),
            },
          },
        }),
      );

      const { createFamilyStudent } = await import("@/lib/family/family-students.server");
      await expect(createFamilyStudent("parent-1", { name: "Alex" })).rejects.toThrow(
        "Failed to create family student: timeout",
      );
    });

    it("throws when update student fails", async () => {
      supabaseMocks.createSupabaseAdmin.mockReturnValue(
        createSupabaseMock({
          failures: [{ key: "family_students.update", message: "permission denied" }],
          singleRow: {
            family_students: {
              id: "student-1",
              parent_clerk_user_id: "parent-1",
              name: "Alex",
              display_name: "Alex",
              preferences: {},
              created_at: new Date().toISOString(),
            },
          },
        }),
      );

      const { updateFamilyStudent } = await import("@/lib/family/family-students.server");
      await expect(
        updateFamilyStudent("parent-1", "student-1", { displayName: "AJ" }),
      ).rejects.toThrow("Failed to update family student: permission denied");
    });
  });
});
