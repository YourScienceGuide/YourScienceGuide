import type { LessonVideoMeta } from "@/lib/admin/content-store";

export const MOCK_LESSON_VIDEO = {
  title: "Introduction: Cells & Photosynthesis",
  description:
    "Watch how plant cells capture light and turn it into food before you practice.",
} as const;

export type ResolvedLessonVideoCopy = {
  hasUpload: boolean;
  hasSavedMeta: boolean;
  title: string;
  description: string;
  showTitle: boolean;
  showDescription: boolean;
  showMetadata: boolean;
};

/**
 * Resolve student-facing video title/description.
 * Mock marketing copy is used only when there is no lesson_videos row.
 * Title/description-only admin saves (no uploaded file) must still win.
 */
export function resolveLessonVideoCopy(
  meta: LessonVideoMeta | undefined | null,
): ResolvedLessonVideoCopy {
  const hasUpload = Boolean(meta?.muxPlaybackId || meta?.sourceUrl);
  const hasSavedMeta = meta != null;
  const customTitle = meta?.title?.trim() ?? "";
  const customDescription = meta?.description?.trim() ?? "";

  const title = hasSavedMeta ? customTitle : MOCK_LESSON_VIDEO.title;
  const description = hasSavedMeta
    ? customDescription
    : MOCK_LESSON_VIDEO.description;

  return {
    hasUpload,
    hasSavedMeta,
    title,
    description,
    showTitle: title.length > 0,
    showDescription: description.length > 0,
    showMetadata: title.length > 0 || description.length > 0,
  };
}
