import { BookOpen } from "lucide-react";

import type { Textbook, TextbookReading } from "@/lib/student/textbook";
import { getTextbookDisplayTitle } from "@/lib/student/textbook";

type RequiredReadingsProps = {
  textbook: Textbook;
  readings: TextbookReading[];
};

export function RequiredReadings({ textbook, readings }: RequiredReadingsProps) {
  const fullTitle = getTextbookDisplayTitle(textbook);

  return (
    <section
      className="rounded-lg border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/50 dark:bg-amber-950/30"
      aria-labelledby="required-readings-heading"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
          aria-hidden
        >
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <h2
              id="required-readings-heading"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-stone-50"
            >
              Required readings
            </h2>
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Read these sections in{" "}
              <span className="font-medium text-slate-800 dark:text-stone-200">
                {fullTitle}
              </span>{" "}
              ({textbook.edition}) before watching the lesson video.
            </p>
          </div>

          <ol className="space-y-3">
            {readings.map((reading) => (
              <li
                key={`${reading.section}-${reading.title}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-md border border-amber-200/80 bg-white px-4 py-3 dark:border-amber-900/40 dark:bg-stone-900/80"
              >
                <span className="text-sm text-slate-800 dark:text-stone-200">
                  <span className="font-semibold tabular-nums text-amber-800 dark:text-amber-300">
                    {reading.section}
                  </span>
                  <span className="mx-2 text-slate-400 dark:text-stone-600">
                    ·
                  </span>
                  {reading.title}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-stone-500">
                  {reading.pages}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
