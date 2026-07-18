"use client";

import { SignUp } from "@clerk/nextjs";
import { Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { clerkAppearance } from "@/lib/clerk-appearance";

function SignUpContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-sky-50 px-4 py-10 dark:bg-stone-950">
      <div className="mb-8 space-y-3 text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-stone-800 dark:text-stone-200"
          aria-hidden
        >
          <Lock className="size-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Your Science Guide
        </h1>
        <p className="max-w-sm text-sm text-slate-600 dark:text-stone-400">
          Create a family account to track progress and manage students.
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-[420px] justify-center">
        <SignUp
          appearance={clerkAppearance}
          {...(redirectUrl
            ? {
                fallbackRedirectUrl: redirectUrl,
                forceRedirectUrl: redirectUrl,
              }
            : {})}
        />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-slate-600 dark:text-stone-400">
          Loading…
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
