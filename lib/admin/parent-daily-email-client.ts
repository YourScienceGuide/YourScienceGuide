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
