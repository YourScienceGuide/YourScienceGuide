"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown } from "lucide-react";

import type { AdminTabId } from "@/lib/admin/admin-preferences";
import {
  ADMIN_NAV_GROUPS,
  adminNavGroupForTab,
  adminTabFromPathname,
} from "@/lib/routes/admin";
import { cn } from "@/lib/utils";

type AdminNavGroupDropdownProps = {
  group: (typeof ADMIN_NAV_GROUPS)[number];
  activeTab: AdminTabId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function AdminNavGroupDropdown({
  group,
  activeTab,
  open,
  onOpenChange,
}: AdminNavGroupDropdownProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const groupActive = group.items.some((item) => item.id === activeTab);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const openMenu = useCallback(
    (focusIndex = 0) => {
      onOpenChange(true);
      window.requestAnimationFrame(() => {
        itemRefs.current[focusIndex]?.focus();
      });
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  function focusItem(index: number) {
    const count = group.items.length;
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    itemRefs.current[next]?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        event.preventDefault();
        openMenu(0);
        break;
      case "ArrowUp":
        event.preventDefault();
        openMenu(group.items.length - 1);
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      default:
        break;
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = itemRefs.current.findIndex(
      (node) => node === document.activeElement,
    );

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(currentIndex < 0 ? 0 : currentIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(currentIndex < 0 ? group.items.length - 1 : currentIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(group.items.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          groupActive || open
            ? "bg-sky-600 text-white dark:bg-stone-100 dark:text-stone-900"
            : "text-slate-600 hover:bg-sky-50 dark:text-stone-400 dark:hover:bg-stone-800",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          if (open) close();
          else openMenu(0);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {group.label}
        <ChevronDown
          className={cn(
            "size-3.5 opacity-80 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={group.label}
          className="absolute left-0 top-full z-50 mt-2 min-w-[14rem] overflow-hidden rounded-lg border border-sky-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-900"
          onKeyDown={onMenuKeyDown}
        >
          {group.items.map((item, index) => {
            const itemActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                aria-current={itemActive ? "page" : undefined}
                className={cn(
                  "block px-3 py-2 text-sm transition-colors outline-none focus-visible:bg-sky-100 dark:focus-visible:bg-stone-800",
                  itemActive
                    ? "bg-sky-600 font-medium text-white dark:bg-stone-100 dark:text-stone-900"
                    : "text-slate-700 hover:bg-sky-50 dark:text-stone-300 dark:hover:bg-stone-800",
                )}
                onClick={close}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const activeTab = adminTabFromPathname(pathname);
  const activeGroup = adminNavGroupForTab(activeTab);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroupId(null);
  }, [pathname]);

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-sky-200 pb-2 dark:border-stone-700 sm:gap-2"
      aria-label="Admin sections"
    >
      {ADMIN_NAV_GROUPS.map((group) => (
        <AdminNavGroupDropdown
          key={group.id}
          group={group}
          activeTab={activeTab}
          open={openGroupId === group.id}
          onOpenChange={(open) =>
            setOpenGroupId(open ? group.id : null)
          }
        />
      ))}
      {activeGroup && (
        <p className="sr-only">
          Current section: {activeGroup.label}
          {activeTab ? `, ${activeTab}` : ""}
        </p>
      )}
    </nav>
  );
}
