import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildManualParentDailyEmailExport } from "@/lib/email/export-manual-parent-emails.server";

import {
  formatCombinedManualParentEmails,
  formatManualParentEmailFile,
  type ManualParentEmailExport,
} from "@/lib/email/manual-parent-email-format";

const emailMocks = vi.hoisted(() => ({
  buildParentDailyDigest: vi.fn(),
  digestTemplateVariables: vi.fn(),
  getParentPrimaryEmail: vi.fn(),
  listFamilyStudentsForDailyEmail: vi.fn(),
  loadParentDailyEmailTemplate: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/parent-email.server", () => ({
  getParentPrimaryEmail: emailMocks.getParentPrimaryEmail,
}));

vi.mock("@/lib/email/parent-daily-digest.server", () => ({
  buildParentDailyDigest: emailMocks.buildParentDailyDigest,
  digestTemplateVariables: emailMocks.digestTemplateVariables,
  listFamilyStudentsForDailyEmail: emailMocks.listFamilyStudentsForDailyEmail,
}));

vi.mock("@/lib/email/parent-daily-email-template.server", () => ({
  loadParentDailyEmailTemplate: emailMocks.loadParentDailyEmailTemplate,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("manual parent email export formatting", () => {
  const sample: ManualParentEmailExport = {
    forDate: "2026-07-22",
    generated: [
      {
        to: "parent@example.com",
        subject: "Today’s progress for Alex",
        text: "Hello Parent,\n\nAlex completed lesson 1.",
        studentName: "Alex",
        familyStudentId: "stu-1",
        filename: "parent-daily-2026-07-22-alex.txt",
      },
    ],
    skipped: [{ studentName: "Sam", reason: "No activity today" }],
  };

  it("formats a single email file with To and Subject", () => {
    const file = formatManualParentEmailFile(sample.generated[0]!);
    expect(file).toContain("To: parent@example.com");
    expect(file).toContain("Subject: Today’s progress for Alex");
    expect(file).toContain("Alex completed lesson 1.");
  });

  it("combines emails with skipped summary", () => {
    const combined = formatCombinedManualParentEmails(sample);
    expect(combined).toContain("Generated: 1");
    expect(combined).toContain("EMAIL 1 of 1");
    expect(combined).toContain("SKIPPED");
    expect(combined).toContain("Sam: No activity today");
  });
});

describe("buildManualParentDailyEmailExport", () => {
  it("does not generate manual drafts when the parent daily template is disabled", async () => {
    emailMocks.loadParentDailyEmailTemplate.mockResolvedValue({
      subject: "Daily progress for {{studentName}}",
      body: "Hello {{parentName}}",
      enabled: false,
    });

    const exportData = await buildManualParentDailyEmailExport({
      forDate: new Date("2026-07-22T12:00:00.000Z"),
    });

    expect(exportData).toEqual({
      forDate: "2026-07-22",
      generated: [],
      skipped: [],
    });
    expect(emailMocks.listFamilyStudentsForDailyEmail).not.toHaveBeenCalled();
    expect(emailMocks.buildParentDailyDigest).not.toHaveBeenCalled();
    expect(emailMocks.getParentPrimaryEmail).not.toHaveBeenCalled();
  });

  it("generates unique filenames when student names normalize to the same slug", async () => {
    emailMocks.loadParentDailyEmailTemplate.mockResolvedValue({
      subject: "Daily progress",
      body: "Hello parent",
      enabled: true,
    });
    emailMocks.listFamilyStudentsForDailyEmail.mockResolvedValue([
      {
        id: "student-1",
        display_name: "Alex",
        parent_clerk_user_id: "parent-1",
      },
      {
        id: "student-2",
        display_name: "alex",
        parent_clerk_user_id: "parent-2",
      },
    ]);
    emailMocks.buildParentDailyDigest.mockResolvedValue({
      pendingFreeResponses: [],
    });
    emailMocks.digestTemplateVariables.mockReturnValue({});
    emailMocks.getParentPrimaryEmail.mockResolvedValue("parent@example.com");

    const exportData = await buildManualParentDailyEmailExport({
      forDate: new Date("2026-07-22T12:00:00.000Z"),
    });

    expect(exportData.generated.map((draft) => draft.filename)).toEqual([
      "parent-daily-2026-07-22-alex.txt",
      "parent-daily-2026-07-22-alex-2.txt",
    ]);
  });
});
