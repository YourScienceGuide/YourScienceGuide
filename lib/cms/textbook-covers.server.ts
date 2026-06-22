import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/server";

export const TEXTBOOK_COVERS_BUCKET = "textbook-covers";

const MAX_COVER_BYTES = 1_500_000;

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { buffer, contentType };
}

export async function uploadTextbookCover(
  courseId: string,
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  if (file.size > MAX_COVER_BYTES) {
    throw new Error("Cover image must be 1.5 MB or smaller.");
  }

  const extension = MIME_EXTENSION[file.type] ?? "bin";
  const path = `${courseId}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage.from(TEXTBOOK_COVERS_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload cover: ${error.message}`);
  }

  const { data } = supabase.storage.from(TEXTBOOK_COVERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function resolveTextbookCoverUrl(
  courseId: string,
  coverSrc: string,
): Promise<string> {
  const trimmed = coverSrc.trim();
  if (!trimmed || !trimmed.startsWith("data:")) {
    return trimmed;
  }

  const parsed = parseDataUrl(trimmed);
  if (!parsed) {
    throw new Error("Invalid cover image data.");
  }

  if (parsed.buffer.length > MAX_COVER_BYTES) {
    throw new Error("Cover image must be 1.5 MB or smaller.");
  }

  const extension = MIME_EXTENSION[parsed.contentType] ?? "bin";
  const path = `${courseId}/${Date.now()}.${extension}`;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.storage
    .from(TEXTBOOK_COVERS_BUCKET)
    .upload(path, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload cover: ${error.message}`);
  }

  const { data } = supabase.storage.from(TEXTBOOK_COVERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
