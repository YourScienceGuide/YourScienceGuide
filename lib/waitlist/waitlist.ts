export function normalizeWaitlistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidWaitlistEmail(email: string): boolean {
  const normalized = normalizeWaitlistEmail(email);
  // Practical email check — not full RFC validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function normalizeWaitlistName(name: string | null | undefined): string | null {
  const trimmed = name?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 120) : null;
}

export type WaitlistSignup = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  createdAt: string;
};
