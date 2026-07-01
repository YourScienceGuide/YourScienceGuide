"use client";

import { useEffect, useState } from "react";

import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { useContentStore } from "@/components/admin/content-store-provider";
import { TextbookCover } from "@/components/student/textbook-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeTextbookFromStore,
  setTextbookInStore,
} from "@/lib/admin/content-store";
import {
  buildTextbookCoverAlt,
  createEmptyTextbook,
  getTextbookDisplayTitle,
  type Textbook,
} from "@/lib/student/textbook";

type AdminTextbookSectionProps = {
  courseId: string;
  courseTitle: string;
};

export function AdminTextbookSection({
  courseId,
  courseTitle,
}: AdminTextbookSectionProps) {
  const { store, persist, saving } = useContentStore();
  const existing = store.textbooks?.[courseId];
  const [enabled, setEnabled] = useState(Boolean(existing));
  const [draft, setDraft] = useState<Textbook>(existing ?? createEmptyTextbook());
  const [formFeedback, setFormFeedback] = useState<AdminFeedback | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const next = store.textbooks?.[courseId];
    setEnabled(Boolean(next));
    setDraft(next ?? createEmptyTextbook());
    setUploadError(null);
    setFormFeedback(null);
  }, [courseId, store.textbooks]);

  function updateDraft(patch: Partial<Textbook>) {
    setDraft((current) => ({ ...current, ...patch }));
    setFormFeedback(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormFeedback(null);

    if (!enabled) {
      const result = await persist(removeTextbookFromStore(store, courseId), {
        successMessage: `Removed companion textbook from ${courseTitle}.`,
      });
      if (!result.ok) {
        setFormFeedback({ type: "error", message: result.error });
        return;
      }
      setFormFeedback({
        type: "success",
        message: `Removed companion textbook from ${courseTitle}.`,
      });
      return;
    }

    const title = draft.title.trim();
    const subtitle = draft.subtitle.trim();
    if (!title) {
      setFormFeedback({ type: "error", message: "Textbook title is required." });
      return;
    }

    const textbook: Textbook = {
      title,
      subtitle,
      authors: draft.authors.trim(),
      edition: draft.edition.trim(),
      publisher: draft.publisher.trim(),
      coverSrc: draft.coverSrc.trim(),
      coverAlt:
        draft.coverAlt.trim() || buildTextbookCoverAlt(title, subtitle),
    };

    const result = await persist(setTextbookInStore(store, courseId, textbook), {
      successMessage: `Saved companion textbook for ${courseTitle}.`,
    });
    if (!result.ok) {
      setFormFeedback({ type: "error", message: result.error });
      return;
    }
    setFormFeedback({
      type: "success",
      message: `Saved companion textbook for ${courseTitle}.`,
    });
  }

  async function handleCoverUpload(file: File | null) {
    if (!file) return;
    setUploadError(null);
    try {
      const form = new FormData();
      form.set("courseId", courseId);
      form.set("file", file);

      const res = await fetch("/api/admin/textbook-cover", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not upload cover.");
      }

      const data = (await res.json()) as { url: string };
      updateDraft({ coverSrc: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload cover.");
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-sky-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <div className="space-y-1">
        <h3 className="font-medium text-slate-900 dark:text-stone-50">
          Companion textbook
        </h3>
        <p className="text-sm text-slate-600 dark:text-stone-400">
          Optional reading material shown on the {courseTitle} course page. Upload
          a cover image (stored in Supabase Storage) or paste a URL path.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setFormFeedback(null);
            if (e.target.checked && !draft.title) {
              setDraft(createEmptyTextbook());
            }
          }}
          className="size-4 accent-sky-600"
        />
        <span className="text-slate-800 dark:text-stone-200">
          Show a companion textbook for this course
        </span>
      </label>

      {enabled && (
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="space-y-3">
              <TextbookCover
                src={draft.coverSrc}
                alt={draft.coverAlt || "Textbook cover preview"}
              />
              <label className="block text-xs font-medium text-slate-500 dark:text-stone-500">
                Upload cover image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="mt-1 block w-full text-sm"
                  onChange={(e) => void handleCoverUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {uploadError && (
                <p className="text-xs text-red-700 dark:text-red-300">{uploadError}</p>
              )}
            </div>

            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={draft.title}
                onChange={(title) => updateDraft({ title })}
                required
              />
              <Field
                label="Subtitle"
                value={draft.subtitle}
                onChange={(subtitle) => updateDraft({ subtitle })}
              />
              <Field
                label="Authors"
                value={draft.authors}
                onChange={(authors) => updateDraft({ authors })}
                className="sm:col-span-2"
              />
              <Field
                label="Edition"
                value={draft.edition}
                onChange={(edition) => updateDraft({ edition })}
              />
              <Field
                label="Publisher"
                value={draft.publisher}
                onChange={(publisher) => updateDraft({ publisher })}
              />
              <Field
                label="Cover image URL"
                value={draft.coverSrc.startsWith("data:") ? "" : draft.coverSrc}
                onChange={(coverSrc) => updateDraft({ coverSrc })}
                placeholder="/textbooks/my-cover.svg"
                className="sm:col-span-2"
              />
              <Field
                label="Cover alt text"
                value={draft.coverAlt}
                onChange={(coverAlt) => updateDraft({ coverAlt })}
                placeholder="Cover of Life Science: A Biological Approach"
                className="sm:col-span-2"
              />
            </div>
          </div>

          {draft.title.trim() && (
            <p className="text-sm text-slate-600 dark:text-stone-400">
              Preview title:{" "}
              <span className="font-medium text-slate-900 dark:text-stone-100">
                {getTextbookDisplayTitle({
                  ...draft,
                  title: draft.title.trim(),
                  subtitle: draft.subtitle.trim(),
                })}
              </span>
            </p>
          )}

          <div className="space-y-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save textbook"}
            </Button>
            <AdminActionFeedback
              feedback={formFeedback}
              onDismiss={() => setFormFeedback(null)}
            />
          </div>
        </form>
      )}

      {!enabled && (
        <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
          <Button type="submit" size="sm" variant="outline" disabled={saving}>
            {saving ? "Saving…" : "Remove companion textbook"}
          </Button>
          <AdminActionFeedback
            feedback={formFeedback}
            onDismiss={() => setFormFeedback(null)}
          />
        </form>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 text-xs font-medium text-slate-500 dark:text-stone-500 ${className ?? ""}`}>
      {label}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="text-sm"
      />
    </label>
  );
}
