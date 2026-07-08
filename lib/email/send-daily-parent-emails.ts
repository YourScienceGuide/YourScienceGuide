import "server-only";

import {
  buildFreeResponseSection,
  sentOnDateString,
} from "@/lib/email/parent-daily-digest";
import {
  buildParentDailyDigest,
  digestTemplateVariables,
  listFamilyStudentsForDailyEmail,
  logDailyEmailResult,
  wasDailyEmailSent,
} from "@/lib/email/parent-daily-digest.server";
import { loadParentDailyEmailTemplate } from "@/lib/email/parent-daily-email-template.server";
import {
  plainTextToHtml,
  renderEmailTemplate,
} from "@/lib/email/render-template";
import { getEmailFromAddress, isEmailSendingConfigured, sendEmail } from "@/lib/email/send-email";
import { getParentPrimaryEmail } from "@/lib/auth/parent-email.server";

export type DailyParentEmailRunSummary = {
  configured: boolean;
  templateEnabled: boolean;
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
};

export async function sendDailyParentEmails(input?: {
  forDate?: Date;
  force?: boolean;
}): Promise<DailyParentEmailRunSummary> {
  const forDate = input?.forDate ?? new Date();
  const sentOn = sentOnDateString(forDate);
  const template = await loadParentDailyEmailTemplate();
  const configured = isEmailSendingConfigured();

  const summary: DailyParentEmailRunSummary = {
    configured,
    templateEnabled: template.enabled,
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  if (!template.enabled) {
    return summary;
  }

  const students = await listFamilyStudentsForDailyEmail();

  for (const student of students) {
    summary.processed += 1;

    if (!input?.force && (await wasDailyEmailSent(student.id, sentOn))) {
      summary.skipped += 1;
      continue;
    }

    const digest = await buildParentDailyDigest({
      student,
      parentClerkUserId: student.parent_clerk_user_id,
      forDate,
    });

    if (!digest) {
      await logDailyEmailResult({
        parentClerkUserId: student.parent_clerk_user_id,
        familyStudentId: student.id,
        sentOn,
        status: "skipped",
        errorMessage: "No activity today",
      });
      summary.skipped += 1;
      continue;
    }

    const variables = digestTemplateVariables(digest);
    const subject = renderEmailTemplate(template.subject, variables).trim();
    const textBody = renderEmailTemplate(template.body, variables).trim();
    const htmlVariables = {
      ...variables,
      freeResponseSection: buildFreeResponseSection(digest.pendingFreeResponses, {
        html: true,
      }),
    };
    const htmlBody = plainTextToHtml(
      renderEmailTemplate(template.body, htmlVariables).trim(),
    );

    const parentEmail = await getParentPrimaryEmail(student.parent_clerk_user_id);
    if (!parentEmail) {
      await logDailyEmailResult({
        parentClerkUserId: student.parent_clerk_user_id,
        familyStudentId: student.id,
        sentOn,
        status: "failed",
        errorMessage: "Parent email not found",
      });
      summary.failed += 1;
      continue;
    }

    const from = getEmailFromAddress();
    if (!from) {
      await logDailyEmailResult({
        parentClerkUserId: student.parent_clerk_user_id,
        familyStudentId: student.id,
        sentOn,
        status: "skipped",
        errorMessage: "EMAIL_FROM not configured",
      });
      summary.skipped += 1;
      continue;
    }

    const result = await sendEmail({
      to: parentEmail,
      from,
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (result.ok) {
      await logDailyEmailResult({
        parentClerkUserId: student.parent_clerk_user_id,
        familyStudentId: student.id,
        sentOn,
        status: "sent",
      });
      summary.sent += 1;
    } else if (result.reason === "not_configured") {
      await logDailyEmailResult({
        parentClerkUserId: student.parent_clerk_user_id,
        familyStudentId: student.id,
        sentOn,
        status: "skipped",
        errorMessage: "Email provider not configured",
      });
      summary.skipped += 1;
    } else {
      await logDailyEmailResult({
        parentClerkUserId: student.parent_clerk_user_id,
        familyStudentId: student.id,
        sentOn,
        status: "failed",
        errorMessage: result.detail ?? "Send failed",
      });
      summary.failed += 1;
    }
  }

  return summary;
}
