export type ManualParentEmailDraft = {
  to: string;
  subject: string;
  text: string;
  studentName: string;
  familyStudentId: string;
  filename: string;
};

export type ManualParentEmailExport = {
  forDate: string;
  generated: ManualParentEmailDraft[];
  skipped: Array<{ studentName: string; reason: string }>;
};

export function formatManualParentEmailFile(draft: ManualParentEmailDraft): string {
  return [
    `To: ${draft.to}`,
    `Subject: ${draft.subject}`,
    "",
    draft.text,
    "",
  ].join("\n");
}

export function formatCombinedManualParentEmails(
  exportData: ManualParentEmailExport,
): string {
  const header = [
    `Your Science Guide — parent daily emails for ${exportData.forDate}`,
    `Generated: ${exportData.generated.length}`,
    `Skipped: ${exportData.skipped.length}`,
    "",
  ];

  const blocks = exportData.generated.map((draft, index) => {
    return [
      "=".repeat(60),
      `EMAIL ${index + 1} of ${exportData.generated.length}`,
      `Student: ${draft.studentName}`,
      "=".repeat(60),
      formatManualParentEmailFile(draft).trimEnd(),
      "",
    ].join("\n");
  });

  const skippedBlock =
    exportData.skipped.length > 0
      ? [
          "=".repeat(60),
          "SKIPPED",
          "=".repeat(60),
          ...exportData.skipped.map(
            (item) => `- ${item.studentName}: ${item.reason}`,
          ),
          "",
        ]
      : [];

  return [...header, ...blocks, ...skippedBlock].join("\n");
}
