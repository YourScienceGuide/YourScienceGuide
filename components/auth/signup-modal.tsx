"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REASON_COPY: Record<string, { title: string; description: string }> = {
  limit: {
    title: "Create an account to keep learning",
    description:
      "You've completed your 2 free preview lessons as a guest. Sign up to save progress and unlock the full curriculum.",
  },
  locked: {
    title: "Sign up to unlock this lesson",
    description:
      "Advanced lessons require an account. Preview lessons are free for guests—create an account for full access.",
  },
  default: {
    title: "Sign up for Your Science Guide",
    description:
      "Create a free account to track progress across lessons, manage students, and subscribe when you're ready.",
  },
};

export function SignupModal() {
  const { signupModalOpen, signupModalReason, closeSignupModal } = useAuth();
  const copy =
    REASON_COPY[signupModalReason ?? "default"] ?? REASON_COPY.default;

  return (
    <Dialog
      open={signupModalOpen}
      onOpenChange={(open) => {
        if (!open) closeSignupModal();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/sign-up" onClick={closeSignupModal}>
              Create account
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/sign-in" onClick={closeSignupModal}>
              Sign in
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
