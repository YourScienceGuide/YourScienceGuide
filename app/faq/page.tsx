import type { Metadata } from "next";

import { loadPublishedFaqContent } from "@/lib/faq/faq.server";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Your Science Guide.",
};

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faq = await loadPublishedFaqContent();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          {faq.title}
        </h1>
        {faq.intro.trim() && (
          <p className="text-base leading-relaxed text-slate-600 dark:text-stone-400 whitespace-pre-wrap">
            {faq.intro}
          </p>
        )}
      </header>

      {faq.entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-stone-500">
          FAQ content is being updated. Please check back soon.
        </p>
      ) : (
        <dl className="space-y-6">
          {faq.entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
            >
              <dt className="text-base font-semibold text-slate-900 dark:text-stone-50">
                {entry.question}
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-stone-400 whitespace-pre-wrap">
                {entry.answer}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
