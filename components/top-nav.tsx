"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { useActiveStudent } from "@/components/family/active-student-provider";
import { SettingsMenu } from "@/components/settings/settings-menu";
import { getHeaderEnvLabel } from "@/lib/deploy-label";
import { siteContainerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const envLabel = getHeaderEnvLabel();

const baseLinks = [
  { href: "/student", label: "Student" },
  { href: "/parent", label: "Parent" },
  { href: "/faq", label: "FAQ" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { isAdmin, isGuest } = useAuth();
  const { activeStudent, students } = useActiveStudent();
  const onStudentArea = pathname === "/student" || pathname.startsWith("/student/");
  const links = isAdmin
    ? [...baseLinks, { href: "/admin", label: "Admin" } as const]
    : baseLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-sky-200 bg-white dark:border-stone-700 dark:bg-stone-900">
      <div
        className={cn(
          siteContainerClass,
          "flex h-14 items-center justify-between gap-6",
        )}
      >
        <Link
          href="/"
          className="relative inline-flex items-center text-sm font-medium tracking-tight text-sky-900 dark:text-stone-100"
        >
          <span>Your Science Guide</span>
          {envLabel ? (
            <span
              aria-label={`Environment: ${envLabel}`}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] whitespace-nowrap rounded border border-amber-400/80 bg-amber-200/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm dark:border-amber-600 dark:bg-amber-400/90 dark:text-amber-950"
            >
              {envLabel}
            </span>
          ) : null}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {isGuest && (
            <Button asChild size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          {links.map(({ href, label }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            const showStudentName =
              href === "/student" &&
              onStudentArea &&
              activeStudent &&
              students.length > 1;
            return (
              <Button
                key={href}
                asChild
                variant={active ? "default" : "ghost"}
                size="sm"
                className={cn(
                  !active && "text-slate-600 dark:text-stone-400",
                  active && "shadow-none",
                )}
              >
                <Link href={href}>
                  {showStudentName ? activeStudent.displayName : label}
                </Link>
              </Button>
            );
          })}
          <SettingsMenu />
        </nav>
      </div>
    </header>
  );
}
