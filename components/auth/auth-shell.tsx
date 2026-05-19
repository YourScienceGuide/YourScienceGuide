"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { TopNav } from "@/components/top-nav";
import { siteContainerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: ReactNode }) {
  const { ready, authenticated } = useAuth();

  if (!ready) {
    return <SignInScreen checking />;
  }

  if (!authenticated) {
    return <SignInScreen />;
  }

  return (
    <>
      <TopNav />
      <main className={cn(siteContainerClass, "py-10")}>{children}</main>
    </>
  );
}
