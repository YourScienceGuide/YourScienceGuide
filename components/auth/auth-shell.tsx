"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { TopNav } from "@/components/top-nav";
import { siteContainerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated, isAdmin } = useAuth();
  const isAdminRoute = pathname.startsWith("/admin");

  if (!ready) {
    return <SignInScreen checking />;
  }

  if (!authenticated) {
    return <SignInScreen />;
  }

  if (isAdminRoute && !isAdmin) {
    return (
      <>
        <TopNav />
        <main className={cn(siteContainerClass, "py-10")}>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Admin access required. Sign in with the admin account to manage
            curriculum and content.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main className={cn(siteContainerClass, "py-10")}>{children}</main>
    </>
  );
}
