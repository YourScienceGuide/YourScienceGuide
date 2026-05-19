"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <Button type="button" variant="ghost" onClick={signOut}>
      Sign out
    </Button>
  );
}
