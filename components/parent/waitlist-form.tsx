"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WaitlistFormProps = {
  source?: string;
};

export function WaitlistForm({ source = "parent-billing" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<"joined" | "already" | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          source,
          website: honeypot,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        ok?: boolean;
        alreadyJoined?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not join the waitlist.");
      }

      setSuccess(payload.alreadyJoined ? "already" : "joined");
      setEmail("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the waitlist.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
      >
        {success === "already"
          ? "You’re already on the waitlist. We’ll email you when registration opens."
          : "You’re on the waitlist. We’ll email you when registration opens."}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="relative space-y-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="waitlist-name"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <Input
            id="waitlist-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            placeholder="Alex Rivera"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="waitlist-email"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Email
          </label>
          <Input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="you@example.com"
            aria-invalid={Boolean(error)}
          />
        </div>
      </div>

      {/* Honeypot — hidden from people, filled by some bots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting || !email.trim()}>
        {submitting ? "Joining…" : "Join the waitlist"}
      </Button>
    </form>
  );
}
