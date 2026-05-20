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

type Mode = "sign-in" | "create-account";

const inputClassName =
  "w-full rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100";

export function SignInScreen({ checking = false }: SignInScreenProps) {
  const { signIn, createAccount } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isCreate = mode === "create-account";

  function resetSecrets() {
    setPassword("");
    setConfirmPassword("");
    setError(null);
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetSecrets();
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const ok = signIn(username, password);
    if (!ok) {
      setError("Incorrect username or password. Please try again.");
      setSubmitting(false);
    }
  }

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const result = createAccount(username, password);
    if (!result.ok) {
      setError(result.error);
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
            {isCreate
              ? "Create a family account. Subscribe in the parent portal to unlock lessons."
              : "Sign in to access your courses and lessons."}
          </p>
        </div>

        <div className="flex rounded-lg border border-sky-200 bg-sky-100/50 p-1 dark:border-stone-700 dark:bg-stone-800/50">
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              !isCreate
                ? "bg-white text-slate-900 shadow-sm dark:bg-stone-900 dark:text-stone-50"
                : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-200",
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("create-account")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isCreate
                ? "bg-white text-slate-900 shadow-sm dark:bg-stone-900 dark:text-stone-50"
                : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-200",
            )}
          >
            Create account
          </button>
        </div>

        <form
          onSubmit={isCreate ? handleCreateAccount : handleSignIn}
          className="space-y-5 rounded-lg border border-sky-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900"
        >
          <fieldset className="space-y-4" disabled={checking || submitting}>
            <legend className="sr-only">
              {isCreate ? "Create account" : "Sign in"}
            </legend>

            <div className="space-y-1">
              <label
                htmlFor="auth-username"
                className="text-sm font-medium text-slate-700 dark:text-stone-300"
              >
                Username
              </label>
              <input
                id="auth-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={inputClassName}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="auth-password"
                className="text-sm font-medium text-slate-700 dark:text-stone-300"
              >
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isCreate ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isCreate ? 6 : undefined}
                className={inputClassName}
              />
            </div>

            {isCreate && (
              <div className="space-y-1">
                <label
                  htmlFor="auth-confirm-password"
                  className="text-sm font-medium text-slate-700 dark:text-stone-300"
                >
                  Confirm password
                </label>
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClassName}
                />
              </div>
            )}
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
            {checking
              ? "Checking session…"
              : isCreate
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        {!isCreate && (
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
        )}

        {isCreate && (
          <p className="text-center text-xs text-slate-500 dark:text-stone-500">
            New accounts can use the parent portal immediately. Lessons unlock
            after you choose a monthly or annual plan.
          </p>
        )}
      </div>
    </div>
  );
}