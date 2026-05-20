"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthForm } from "@/components/auth/auth-form";
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
        <AuthForm onSuccess={closeSignupModal} />
      </DialogContent>
    </Dialog>
  );
}
