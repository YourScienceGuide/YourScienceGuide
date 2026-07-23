import type { ParentDailyEmailTemplate } from "@/lib/email/default-parent-daily-template";

export type ParentDailyEmailSettingsResponse = {
  template: ParentDailyEmailTemplate;
  emailFrom: string | null;
  sendingConfigured: boolean;
};

export async function fetchParentDailyEmailSettings(): Promise<ParentDailyEmailSettingsResponse> {
  const res = await fetch("/api/admin/parent-daily-email");
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to load email settings");
  }
  return (await res.json()) as ParentDailyEmailSettingsResponse;
}

export async function saveParentDailyEmailTemplate(
  template: ParentDailyEmailTemplate,
): Promise<ParentDailyEmailTemplate> {
  const res = await fetch("/api/admin/parent-daily-email", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to save email template");
  }
  const data = (await res.json()) as { template: ParentDailyEmailTemplate };
  return data.template;
}

export async function previewParentDailyEmail(input: {
  subject: string;
  body: string;
}): Promise<{ subject: string; text: string }> {
  const res = await fetch("/api/admin/parent-daily-email/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to preview email");
  }
  return (await res.json()) as { subject: string; text: string };
}

export type ManualParentEmailFile = {
  filename: string;
  content: string;
  to: string;
  subject: string;
  studentName: string;
};

export async function downloadCombinedManualParentEmails(): Promise<{
  blob: Blob;
  filename: string;
  generated: number;
  skipped: number;
}> {
  const res = await fetch("/api/admin/parent-daily-email/export-manual?format=combined");
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to export parent emails");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  return {
    blob,
    filename: match?.[1] ?? "parent-daily-emails.txt",
    generated: Number(res.headers.get("X-YSG-Email-Generated") ?? "0"),
    skipped: Number(res.headers.get("X-YSG-Email-Skipped") ?? "0"),
  };
}

export async function fetchSeparateManualParentEmails(): Promise<{
  forDate: string;
  skipped: Array<{ studentName: string; reason: string }>;
  files: ManualParentEmailFile[];
}> {
  const res = await fetch("/api/admin/parent-daily-email/export-manual?format=separate");
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to export parent emails");
  }
  return (await res.json()) as {
    forDate: string;
    skipped: Array<{ studentName: string; reason: string }>;
    files: ManualParentEmailFile[];
  };
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadCombinedManualParentEmailsFile(): Promise<{
  generated: number;
  skipped: number;
}> {
  const result = await downloadCombinedManualParentEmails();
  triggerBrowserDownload(result.blob, result.filename);
  return { generated: result.generated, skipped: result.skipped };
}

export async function downloadSeparateManualParentEmailFiles(): Promise<{
  generated: number;
  skipped: number;
}> {
  const result = await fetchSeparateManualParentEmails();
  for (const file of result.files) {
    triggerBrowserDownload(
      new Blob([file.content], { type: "text/plain;charset=utf-8" }),
      file.filename,
    );
  }
  return { generated: result.files.length, skipped: result.skipped.length };
}
