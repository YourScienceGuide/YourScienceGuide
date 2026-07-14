"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const { signOut } = useAuth();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={signOut}
      className={cn(
        "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-200",
        className,
      )}
    >
      Sign out
    </Button>
  );
}
