"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  MOCK_ADMIN_USERNAME,
  MOCK_PASSWORD,
  MOCK_USERNAME,
} from "@/lib/auth/constants";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "create-account";

const inputClassName =
  "w-full rounded-md border border-sky-200 bg-white px-4 py-3 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100";

type AuthFormProps = {
  onSuccess?: () => void;
  showDemoHint?: boolean;
  className?: string;
};

export function AuthForm({
  onSuccess,
  showDemoHint = true,
  className,
}: AuthFormProps) {
  const { signIn, createAccount } = useAuth();
  const [mode, setMode] = useState<Mode>("create-account");
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
      return;
    }
    onSuccess?.();
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
      return;
    }
    onSuccess?.();
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex rounded-lg border border-sky-200 bg-sky-100/50 p-1 dark:border-stone-700 dark:bg-stone-800/50">
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
          Sign up
        </button>
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
      </div>

      <form
        onSubmit={isCreate ? handleCreateAccount : handleSignIn}
        className="space-y-4"
      >
        <div className="space-y-1">
          <label
            htmlFor="auth-form-username"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Username
          </label>
          <input
            id="auth-form-username"
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
            htmlFor="auth-form-password"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Password
          </label>
          <input
            id="auth-form-password"
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
              htmlFor="auth-form-confirm"
              className="text-sm font-medium text-slate-700 dark:text-stone-300"
            >
              Confirm password
            </label>
            <input
              id="auth-form-confirm"
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

        {error && (
          <p
            role="alert"
            className="text-sm font-medium text-red-700 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting
            ? "Please wait…"
            : isCreate
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      {showDemoHint && !isCreate && (
        <p className="text-center text-xs text-slate-500 dark:text-stone-500">
          Demo — Student:{" "}
          <span className="font-mono">{MOCK_USERNAME}</span>
          {" · Admin: "}
          <span className="font-mono">{MOCK_ADMIN_USERNAME}</span>
          {" · Password: "}
          <span className="font-mono">{MOCK_PASSWORD}</span>
        </p>
      )}
    </div>
  );
}
