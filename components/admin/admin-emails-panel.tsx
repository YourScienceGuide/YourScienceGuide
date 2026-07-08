"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import { AdminLessonPicker } from "@/components/admin/admin-lesson-picker";
import { useContentStore } from "@/components/admin/content-store-provider";
import { useAdminWorkspace } from "@/components/admin/admin-workspace-provider";
import {
  fetchParentDailyEmailSettings,
  previewParentDailyEmail,
  saveParentDailyEmailTemplate,
} from "@/lib/admin/parent-daily-email-client";
import { getLessonFromStore } from "@/lib/admin/content-store";
import {
  DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE,
  PARENT_DAILY_EMAIL_VARIABLES,
  type ParentDailyEmailTemplate,
} from "@/lib/email/default-parent-daily-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminEmailsPanel() {
  const { store, persist, saving, actionFeedback, clearActionFeedback } =
    useContentStore();
  const { courseId, lessonId, setCourseId, setLessonId } = useAdminWorkspace();
  const lesson = getLessonFromStore(store, courseId, lessonId);

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ParentDailyEmailTemplate>(
    DEFAULT_PARENT_DAILY_EMAIL_TEMPLATE,
  );
  const [emailFrom, setEmailFrom] = useState<string | null>(null);
  const [sendingConfigured, setSendingConfigured] = useState(false);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [engagementDraft, setEngagementDraft] = useState("");
  const [rubricDraft, setRubricDraft] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const settings = await fetchParentDailyEmailSettings();
      setDraft(settings.template);
      setEmailFrom(settings.emailFrom);
      setSendingConfigured(settings.sendingConfigured);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to load email settings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setEngagementDraft(lesson?.parentEngagementPrompt ?? "");
    setRubricDraft(lesson?.freeResponseRubric ?? "");
  }, [lesson?.parentEngagementPrompt, lesson?.freeResponseRubric, lessonId]);

  async function handleSaveTemplate() {
    setSaveMessage(null);
    setSaveError(null);
    try {
      const saved = await saveParentDailyEmailTemplate(draft);
      setDraft(saved);
      setSaveMessage("Saved daily parent email template.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save email template",
      );
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setSaveError(null);
    try {
      const preview = await previewParentDailyEmail({
        subject: draft.subject,
        body: draft.body,
      });
      setPreviewSubject(preview.subject);
      setPreviewText(preview.text);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to preview email",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSaveLessonFields() {
    if (!lesson) return;
    const lessons = (store.courses.find((c) => c.id === courseId)?.lessons ?? []).map(
      (entry) =>
        entry.id === lesson.id
          ? {
              ...entry,
              parentEngagementPrompt: engagementDraft,
              freeResponseRubric: rubricDraft,
            }
          : entry,
    );
    await persist({
      ...store,
      courses: store.courses.map((course) =>
        course.id === courseId ? { ...course, lessons } : course,
      ),
    }, {
      successMessage: "Saved lesson email fields.",
    });
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-stone-400">
        Loading email settings…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <AdminActionFeedback
        feedback={actionFeedback}
        onDismiss={clearActionFeedback}
      />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Parent daily email
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-stone-400">
          Customize the email parents receive each day with their student&apos;s
          progress, pending free-response grading, flashcards, and discussion prompts.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-stone-50">
          Delivery status
        </h2>
        <dl className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-stone-400 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-700 dark:text-stone-300">From address</dt>
            <dd>{emailFrom ?? "Set EMAIL_FROM in your environment"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700 dark:text-stone-300">Provider</dt>
            <dd>
              {sendingConfigured
                ? "Resend configured"
                : "Add RESEND_API_KEY to enable sending"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700 dark:text-stone-300">Schedule</dt>
            <dd>
              Cron route: <code className="text-xs">/api/cron/daily-parent-email</code>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700 dark:text-stone-300">Template</dt>
            <dd>{draft.enabled ? "Enabled" : "Disabled"}</dd>
          </div>
        </dl>
      </section>

      {(saveMessage || saveError) && (
        <p
          className={cn(
            "text-sm",
            saveError
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {saveError ?? saveMessage}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
            Email template
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft((current) => ({ ...current, enabled: e.target.checked }))
              }
            />
            Send daily emails when configured
          </label>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="parent-email-subject"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Subject
          </label>
          <Input
            id="parent-email-subject"
            value={draft.subject}
            onChange={(e) =>
              setDraft((current) => ({ ...current, subject: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="parent-email-body"
            className="text-sm font-medium text-slate-700 dark:text-stone-300"
          >
            Body
          </label>
          <textarea
            id="parent-email-body"
            rows={16}
            value={draft.body}
            onChange={(e) =>
              setDraft((current) => ({ ...current, body: e.target.value }))
            }
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleSaveTemplate()}>
            Save template
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={previewLoading}
            onClick={() => void handlePreview()}
          >
            {previewLoading ? "Previewing…" : "Preview with sample data"}
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
            Template variables
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-stone-400">
            {PARENT_DAILY_EMAIL_VARIABLES.map((variable) => (
              <li key={variable.key}>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-stone-800">
                  {`{{${variable.key}}}`}
                </code>{" "}
                — {variable.description}
              </li>
            ))}
          </ul>
        </div>

        {(previewSubject || previewText) && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-stone-700 dark:bg-stone-900/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
              Preview
            </h2>
            <p className="text-sm font-medium text-slate-800 dark:text-stone-200">
              Subject: {previewSubject}
            </p>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-stone-300">
              {previewText}
            </pre>
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8 dark:border-stone-700">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
            Per-lesson parent content
          </h2>
          <p className="text-sm text-slate-600 dark:text-stone-400">
            Discussion prompts and free-response rubrics are included in the daily
            email for lessons the student worked on.
          </p>
        </header>

        <AdminLessonPicker
          store={store}
          courseId={courseId}
          lessonId={lessonId}
          onCourseChange={setCourseId}
          onLessonChange={setLessonId}
        />

        {lesson && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="parent-engagement-prompt"
                className="text-sm font-medium text-slate-700 dark:text-stone-300"
              >
                Discussion prompt (parent engagement)
              </label>
              <textarea
                id="parent-engagement-prompt"
                rows={4}
                value={engagementDraft}
                onChange={(e) => setEngagementDraft(e.target.value)}
                placeholder="Ask your student to explain…"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="free-response-rubric"
                className="text-sm font-medium text-slate-700 dark:text-stone-300"
              >
                Free-response grading rubric
              </label>
              <textarea
                id="free-response-rubric"
                rows={6}
                value={rubricDraft}
                onChange={(e) => setRubricDraft(e.target.value)}
                placeholder={"10: Complete answer…\n7: Mostly correct…"}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
              />
            </div>

            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveLessonFields()}
            >
              {saving ? "Saving…" : "Save lesson fields"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
