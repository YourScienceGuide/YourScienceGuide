"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  MOCK_ADMIN_USERNAME,
  MOCK_PASSWORD,
  MOCK_USERNAME,
} from "@/lib/auth/constants";
import { cn } from "@/lib/utils";

type SignInScreenProps = {
  checking?: boolean;
};

export function SignInScreen({ checking = false }: SignInScreenProps) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const ok = signIn(username, password);
    if (!ok) {
      setError("Incorrect username or password. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex min-h-dvh items-center justify-center",
        "bg-sky-50 px-4 dark:bg-stone-950",
      )}
      aria-busy={checking}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <span
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-stone-800 dark:text-stone-200"
            aria-hidden
          >
            <Lock className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
            Your Science Guide
          </h1>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Sign in to access your courses and lessons.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-sky-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900"
        >
          <fieldset className="space-y-4" disabled={checking || submitting}>
            <legend className="sr-only">Sign in</legend>

            <div className="space-y-1">
              <label
                htmlFor="sign-in-username"
                className="text-sm font-medium text-slate-700 dark:text-stone-300"
              >
                Username
              </label>
              <input
                id="sign-in-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="sign-in-password"
                className="text-sm font-medium text-slate-700 dark:text-stone-300"
              >
                Password
              </label>
              <input
                id="sign-in-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
              />
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="text-sm font-medium text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={checking || submitting}
          >
            {checking ? "Checking session…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-stone-500">
          Student:{" "}
          <span className="font-mono text-slate-600 dark:text-stone-400">
            {MOCK_USERNAME}
          </span>
          {" · "}
          Admin:{" "}
          <span className="font-mono text-slate-600 dark:text-stone-400">
            {MOCK_ADMIN_USERNAME}
          </span>
          {" · "}
          Password:{" "}
          <span className="font-mono text-slate-600 dark:text-stone-400">
            {MOCK_PASSWORD}
          </span>
        </p>
      </div>
    </div>
  );
}
