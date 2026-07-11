"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminFeedback } from "@/components/admin/admin-action-feedback";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { fetchFaqContentAdmin, saveFaqContentAdmin } from "@/lib/admin/faq-client";
import {
  ADMIN_SAVE_PUBLISHED_MESSAGE,
  successSaveFeedback,
} from "@/lib/admin/admin-save-feedback";
import { formatSaveError } from "@/lib/admin/format-save-error";
import { createEmptyFaqEntry, DEFAULT_FAQ_CONTENT } from "@/lib/faq/default-faq";
import type { FaqContent, FaqEntry } from "@/lib/faq/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function entriesKey(entries: FaqEntry[]) {
  return JSON.stringify(entries);
}

export function AdminFaqPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<FaqContent>(DEFAULT_FAQ_CONTENT);
  const [draft, setDraft] = useState<FaqContent>(DEFAULT_FAQ_CONTENT);
  const [saveFeedback, setSaveFeedback] = useState<AdminFeedback | null>(null);

  const savedKey = useMemo(() => entriesKey(saved.entries), [saved.entries]);
  const draftKey = useMemo(() => entriesKey(draft.entries), [draft.entries]);

  const isDirty =
    draft.title !== saved.title ||
    draft.intro !== saved.intro ||
    draftKey !== savedKey ||
    draft.entries.some(
      (entry, index) =>
        entry.question !== saved.entries[index]?.question ||
        entry.answer !== saved.entries[index]?.answer ||
        entry.published !== saved.entries[index]?.published ||
        entry.id !== saved.entries[index]?.id,
    );

  const loadContent = useCallback(async () => {
    setLoading(true);
    setSaveFeedback(null);
    try {
      const content = await fetchFaqContentAdmin();
      setSaved(content);
      setDraft(content);
    } catch (error) {
      const formatted = formatSaveError(error);
      setSaveFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  function updateEntry(index: number, patch: Partial<FaqEntry>) {
    setSaveFeedback(null);
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function addEntry() {
    setSaveFeedback(null);
    setDraft((current) => ({
      ...current,
      entries: [...current.entries, createEmptyFaqEntry(current.entries.length)],
    }));
  }

  function removeEntry(index: number) {
    setSaveFeedback(null);
    setDraft((current) => ({
      ...current,
      entries: current.entries
        .filter((_, i) => i !== index)
        .map((entry, sortOrder) => ({ ...entry, sortOrder })),
    }));
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.entries.length) return;
    setSaveFeedback(null);
    setDraft((current) => {
      const next = [...current.entries];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return {
        ...current,
        entries: next.map((entry, sortOrder) => ({ ...entry, sortOrder })),
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveFeedback(null);
    try {
      const savedContent = await saveFaqContentAdmin(draft);
      setSaved(savedContent);
      setDraft(savedContent);
      setSaveFeedback(successSaveFeedback(ADMIN_SAVE_PUBLISHED_MESSAGE));
    } catch (error) {
      const formatted = formatSaveError(error);
      setSaveFeedback({
        type: "error",
        message: formatted.message,
        tips: formatted.tips,
      });
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setDraft(saved);
    setSaveFeedback(null);
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-stone-500">Loading FAQ…</p>
    );
  }

  return (
    <div className="space-y-8">
      <AdminSaveBar
        isDirty={isDirty}
        saving={saving}
        feedback={saveFeedback}
        dirtyMessage="You have unsaved FAQ changes. Save to publish them on the public FAQ page."
        onSave={handleSave}
        onDiscard={discardChanges}
        onDismissFeedback={() => setSaveFeedback(null)}
      />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
          FAQ page
        </h2>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-stone-400">
          Edit the public FAQ at{" "}
          <a href="/faq" className="font-medium text-sky-700 underline dark:text-sky-300">
            /faq
          </a>
          . Published entries are visible to everyone; drafts stay hidden until you
          publish them again.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
        <div className="space-y-2">
          <label htmlFor="faq-title" className="text-sm font-medium text-slate-900 dark:text-stone-50">
            Page title
          </label>
          <Input
            id="faq-title"
            value={draft.title}
            onChange={(event) => {
              setSaveFeedback(null);
              setDraft((current) => ({ ...current, title: event.target.value }));
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="faq-intro" className="text-sm font-medium text-slate-900 dark:text-stone-50">
            Introduction
          </label>
          <textarea
            id="faq-intro"
            rows={3}
            value={draft.intro}
            onChange={(event) => {
              setSaveFeedback(null);
              setDraft((current) => ({ ...current, intro: event.target.value }));
            }}
            className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-stone-50">
            Questions
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={addEntry}>
            Add question
          </Button>
        </div>

        {draft.entries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-stone-500">
            No FAQ entries yet. Add a question to get started.
          </p>
        ) : (
          <ul className="space-y-4">
            {draft.entries.map((entry, index) => (
              <li
                key={entry.id}
                className="space-y-3 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
                    Question {index + 1}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-stone-400">
                      <input
                        type="checkbox"
                        checked={entry.published}
                        onChange={(event) =>
                          updateEntry(index, { published: event.target.checked })
                        }
                      />
                      Published
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveEntry(index, -1)}
                    >
                      Move up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === draft.entries.length - 1}
                      onClick={() => moveEntry(index, 1)}
                    >
                      Move down
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-stone-50">
                    Question
                  </label>
                  <Input
                    value={entry.question}
                    onChange={(event) =>
                      updateEntry(index, { question: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-stone-50">
                    Answer
                  </label>
                  <textarea
                    rows={4}
                    value={entry.answer}
                    onChange={(event) =>
                      updateEntry(index, { answer: event.target.value })
                    }
                    className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
