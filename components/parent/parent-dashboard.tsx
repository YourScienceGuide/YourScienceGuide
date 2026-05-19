"use client";

import { useState } from "react";

import { BillingSection } from "@/components/parent/sections/billing";
import { NotificationsSection } from "@/components/parent/sections/notifications";
import { StudentProgressSection } from "@/components/parent/sections/student-progress";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "progress", label: "Student progress" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Subscription" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function ParentDashboard() {
  const [active, setActive] = useState<SectionId>("progress");

  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardBody active={active} setActive={setActive} />
    </div>
  );
}

function DashboardBody({
  active,
  setActive,
}: {
  active: SectionId;
  setActive: (id: SectionId) => void;
}) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <DashboardNav active={active} onSelect={setActive} />
      <DashboardPanel active={active} />
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
        Parent portal
      </h1>
      <p className="text-base text-slate-600 dark:text-stone-400">
        Track progress, manage notifications, and view your subscription.
      </p>
    </header>
  );
}

function DashboardNav({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <>
      <nav
        aria-label="Parent portal sections"
        className="flex gap-1 overflow-x-auto border-b border-sky-200 pb-0 lg:hidden dark:border-stone-700"
      >
        {SECTIONS.map((section) => (
          <NavButton
            key={section.id}
            section={section}
            active={active === section.id}
            onSelect={() => onSelect(section.id)}
            layout="tab"
          />
        ))}
      </nav>
      <nav
        aria-label="Parent portal sections"
        className="hidden w-52 shrink-0 lg:block"
      >
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <NavButton
                section={section}
                active={active === section.id}
                onSelect={() => onSelect(section.id)}
                layout="sidebar"
              />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function NavButton({
  section,
  active,
  onSelect,
  layout,
}: {
  section: (typeof SECTIONS)[number];
  active: boolean;
  onSelect: () => void;
  layout: "tab" | "sidebar";
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap text-sm font-medium transition-colors",
        layout === "tab" &&
          "border-b-2 px-4 py-3 -mb-px",
        layout === "tab" &&
          (active
            ? "border-sky-600 text-sky-700 dark:border-stone-200 dark:text-stone-100"
            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-stone-500 dark:hover:text-stone-300"),
        layout === "sidebar" &&
          "w-full rounded-md px-3 py-2 text-left",
        layout === "sidebar" &&
          (active
            ? "bg-sky-100 text-sky-900 dark:bg-stone-800 dark:text-stone-50"
            : "text-slate-600 hover:bg-sky-50 hover:text-slate-900 dark:text-stone-400 dark:hover:bg-stone-800/80 dark:hover:text-stone-100"),
      )}
    >
      {section.label}
    </button>
  );
}

function DashboardPanel({ active }: { active: SectionId }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-sky-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900 lg:p-8">
      {active === "progress" && <StudentProgressSection />}
      {active === "notifications" && <NotificationsSection />}
      {active === "billing" && <BillingSection />}
    </div>
  );
}
