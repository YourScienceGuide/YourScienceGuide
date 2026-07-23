import type { WaitlistSignup } from "@/lib/waitlist/waitlist";

export async function fetchWaitlistAdmin(): Promise<WaitlistSignup[]> {
  const res = await fetch("/api/admin/waitlist", { cache: "no-store" });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Failed to load waitlist");
  }
  const data = (await res.json()) as { signups: WaitlistSignup[] };
  return data.signups;
}
