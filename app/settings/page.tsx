import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { SwitchStudentButton } from "@/components/student/switch-student-button";
import { SignOutButton } from "@/components/settings/sign-out-button";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Settings
        </h1>
        <p className="text-base text-slate-600 dark:text-stone-400">
          Adjust how Your Science Guide looks on your device.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
          Appearance
        </h2>
        <div className="flex items-center justify-between gap-6 rounded-lg border border-sky-200 bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900">
          <div>
            <p className="font-medium text-slate-900 dark:text-stone-50">
              Dark mode
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
              Switch to the stone palette for low-light reading.
            </p>
          </div>
          <DarkModeToggle />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
          Family
        </h2>
        <div className="flex items-center justify-between gap-6 rounded-lg border border-sky-200 bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900">
          <div>
            <p className="font-medium text-slate-900 dark:text-stone-50">
              Switch student
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
              Choose a different learner before opening courses.
            </p>
          </div>
          <SwitchStudentButton variant="outline" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-500">
          Account
        </h2>
        <div className="flex items-center justify-between gap-6 rounded-lg border border-sky-200 bg-white px-5 py-4 dark:border-stone-700 dark:bg-stone-900">
          <div>
            <p className="font-medium text-slate-900 dark:text-stone-50">
              Sign out
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
              Return to the lock screen on this device.
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
