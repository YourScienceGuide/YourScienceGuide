import "server-only";

import {
  buildFreeResponseSection,
  sentOnDateString,
} from "@/lib/email/parent-daily-digest";
import {
  buildParentDailyDigest,
  digestTemplateVariables,
  listFamilyStudentsForDailyEmail,
} from "@/lib/email/parent-daily-digest.server";
import { loadParentDailyEmailTemplate } from "@/lib/email/parent-daily-email-template.server";
import { renderEmailTemplate } from "@/lib/email/render-template";
import { getParentPrimaryEmail } from "@/lib/auth/parent-email.server";
import type {
  ManualParentEmailDraft,
  ManualParentEmailExport,
} from "@/lib/email/manual-parent-email-format";

export type { ManualParentEmailDraft, ManualParentEmailExport };
export {
  formatCombinedManualParentEmails,
  formatManualParentEmailFile,
} from "@/lib/email/manual-parent-email-format";

function safeFilenamePart(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "parent"
  );
}

/**
 * Builds plain-text parent daily emails for manual sending (e.g. paste into Gmail)
 * without requiring Resend / EMAIL_FROM.
 */
export async function buildManualParentDailyEmailExport(input?: {
  forDate?: Date;
}): Promise<ManualParentEmailExport> {
  const forDate = input?.forDate ?? new Date();
  const forDateLabel = sentOnDateString(forDate);
  const template = await loadParentDailyEmailTemplate();
  const students = await listFamilyStudentsForDailyEmail();

  const generated: ManualParentEmailDraft[] = [];
  const skipped: Array<{ studentName: string; reason: string }> = [];

  for (const student of students) {
    const digest = await buildParentDailyDigest({
      student,
      parentClerkUserId: student.parent_clerk_user_id,
      forDate,
    });

    if (!digest) {
      skipped.push({
        studentName: student.display_name,
        reason: "No activity today",
      });
      continue;
    }

    const parentEmail = await getParentPrimaryEmail(student.parent_clerk_user_id);
    if (!parentEmail) {
      skipped.push({
        studentName: student.display_name,
        reason: "Parent email not found",
      });
      continue;
    }

    const variables = digestTemplateVariables(digest);
    const subject = renderEmailTemplate(template.subject, variables).trim();
    const textBody = renderEmailTemplate(template.body, {
      ...variables,
      freeResponseSection: buildFreeResponseSection(digest.pendingFreeResponses, {
        html: false,
      }),
    }).trim();

    const filename = `parent-daily-${forDateLabel}-${safeFilenamePart(student.display_name)}.txt`;

    generated.push({
      to: parentEmail,
      subject,
      text: textBody,
      studentName: student.display_name,
      familyStudentId: student.id,
      filename,
    });
  }

  return { forDate: forDateLabel, generated, skipped };
}
