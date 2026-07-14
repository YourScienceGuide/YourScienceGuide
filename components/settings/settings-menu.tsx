"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { SETTINGS_SECTIONS } from "@/lib/routes/settings";
import { cn } from "@/lib/utils";

export function SettingsMenu() {
  const pathname = usePathname();
  const { isGuest, signOut, username } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const onSettings = pathname === "/settings" || pathname.startsWith("/settings/");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant={onSettings || open ? "default" : "ghost"}
        size="sm"
        className={cn(
          !onSettings && !open && "text-slate-600 dark:text-stone-400",
          (onSettings || open) && "shadow-none",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        Settings
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Settings"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-sky-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
        >
          {!isGuest && username && (
            <div className="border-b border-sky-100 px-4 py-3 dark:border-stone-800">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
                Signed in as
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-stone-50">
                {username}
              </p>
            </div>
          )}

          <div className="p-1.5">
            {SETTINGS_SECTIONS.map((section) => {
              const active =
                pathname === section.href ||
                pathname.startsWith(`${section.href}/`);
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  role="menuitem"
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sky-100 font-medium text-sky-900 dark:bg-stone-800 dark:text-stone-50"
                      : "text-slate-700 hover:bg-sky-50 dark:text-stone-300 dark:hover:bg-stone-800",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>

          {!isGuest && (
            <div className="border-t border-sky-100 p-2 dark:border-stone-800">
              <button
                type="button"
                role="menuitem"
                className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/50"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
