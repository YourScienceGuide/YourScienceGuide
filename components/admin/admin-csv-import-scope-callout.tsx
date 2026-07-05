export function AdminCsvImportScopeCallout() {
  return (
    <div className="rounded-md border border-sky-200 bg-sky-50/70 px-4 py-3 dark:border-stone-600 dark:bg-stone-950/60">
      <p className="text-sm font-medium text-slate-900 dark:text-stone-50">
        One CSV can update many lessons
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-stone-400">
        Bulk import is not limited to a single chapter or section. Use each row&apos;s{" "}
        <strong className="font-medium text-slate-800 dark:text-stone-200">
          Chapter
        </strong>{" "}
        and{" "}
        <strong className="font-medium text-slate-800 dark:text-stone-200">
          Section
        </strong>{" "}
        columns to route content to matching lessons in the course. A single file can
        populate the whole curriculum at once.
      </p>
    </div>
  );
}
