"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteContainerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/lesson", label: "Lesson" },
  { href: "/parent", label: "Parent" },
  { href: "/settings", label: "Settings" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-sky-200 bg-white/90 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/90">
      <div
        className={cn(
          siteContainerClass,
          "flex h-14 items-center justify-between gap-6",
        )}
      >
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-sky-900 dark:text-stone-100"
        >
          Your Science Guide
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
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
                <Link href={href}>{label}</Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
