import Image from "next/image";

import type { Textbook } from "@/lib/student/textbook";
import { getTextbookDisplayTitle } from "@/lib/student/textbook";

type TextbookCardProps = {
  textbook: Textbook;
};

export function TextbookCard({ textbook }: TextbookCardProps) {
  const fullTitle = getTextbookDisplayTitle(textbook);

  return (
    <section
      className="rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
      aria-labelledby="course-textbook-heading"
    >
      <h2
        id="course-textbook-heading"
        className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-stone-500"
      >
        Companion textbook
      </h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="mx-auto shrink-0 sm:mx-0">
          <Image
            src={textbook.coverSrc}
            alt={textbook.coverAlt}
            width={160}
            height={220}
            className="rounded-md border border-stone-200 shadow-md dark:border-stone-600"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          <p className="text-lg font-semibold text-slate-900 dark:text-stone-50">
            {fullTitle}
          </p>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            {textbook.authors}
          </p>
          <p className="text-sm text-slate-500 dark:text-stone-500">
            {textbook.edition} · {textbook.publisher}
          </p>
          <p className="pt-1 text-sm leading-relaxed text-slate-600 dark:text-stone-400">
            Each lesson lists required sections to read before the video. Keep
            your textbook nearby while you work through the course.
          </p>
        </div>
      </div>
    </section>
  );
}
