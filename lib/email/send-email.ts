export type SendEmailInput = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; provider: string; messageId?: string }
  | { ok: false; reason: "not_configured" | "send_failed"; detail?: string };

export function getEmailFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export function isEmailSendingConfigured(): boolean {
  return Boolean(getEmailFromAddress() && process.env.RESEND_API_KEY?.trim());
}

/**
 * Sends email via Resend when RESEND_API_KEY and EMAIL_FROM are set.
 * Otherwise logs the message and returns not_configured so cron can skip gracefully.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getEmailFromAddress();

  if (!apiKey || !from) {
    console.info("[email] Skipping send — set EMAIL_FROM and RESEND_API_KEY to enable.", {
      to: input.to,
      subject: input.subject,
    });
    return { ok: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[email] Resend API error:", detail);
      return { ok: false, reason: "send_failed", detail };
    }

    const payload = (await response.json()) as { id?: string };
    return { ok: true, provider: "resend", messageId: payload.id };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.error("[email] Send failed:", detail);
    return { ok: false, reason: "send_failed", detail };
  }
}
