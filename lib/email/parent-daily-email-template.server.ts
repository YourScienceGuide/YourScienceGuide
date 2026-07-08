import "server-only";

import {
  DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE,
  PARENT_DAILY_EMAIL_TEMPLATE_ID,
  type ParentDailyEmailTemplate,
} from "@/lib/email/default-parent-daily-template";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

type TemplateRow = {
  subject: string;
  body: string;
  enabled: boolean;
};

export async function loadParentDailyEmailTemplate(): Promise<ParentDailyEmailTemplate> {
  if (!isSupabaseConfigured()) {
    return { ...DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("parent_daily_email_template")
    .select("subject, body, enabled")
    .eq("id", PARENT_DAILY_EMAIL_TEMPLATE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load parent daily email template: ${error.message}`);
  }

  if (!data) {
    return { ...DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE };
  }

  const row = data as TemplateRow;
  return {
    subject: row.subject,
    body: row.body,
    enabled: row.enabled,
  };
}

export async function saveParentDailyEmailTemplate(
  template: ParentDailyEmailTemplate,
): Promise<ParentDailyEmailTemplate> {
  if (!isSupabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const supabase = createSupabaseAdmin();
  const payload = {
    id: PARENT_DAILY_EMAIL_TEMPLATE_ID,
    subject: template.subject.trim(),
    body: template.body,
    enabled: template.enabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("parent_daily_email_template")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to save parent daily email template: ${error.message}`);
  }

  return {
    subject: payload.subject,
    body: payload.body,
    enabled: payload.enabled,
  };
}
