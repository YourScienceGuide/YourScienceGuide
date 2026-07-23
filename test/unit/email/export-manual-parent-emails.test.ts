import { describe, expect, it } from "vitest";

import {
  formatCombinedManualParentEmails,
  formatManualParentEmailFile,
  type ManualParentEmailExport,
} from "@/lib/email/manual-parent-email-format";

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
