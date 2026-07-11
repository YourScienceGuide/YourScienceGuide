import "server-only";

import {
  DEFAULT_FAQ_CONTENT,
  FAQ_PAGE_ID,
} from "@/lib/faq/default-faq";
import type { FaqContent, FaqEntry } from "@/lib/faq/types";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

type FaqPageRow = {
  title: string;
  intro: string;
};

type FaqEntryRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
};

function mapEntryRow(row: FaqEntryRow): FaqEntry {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    published: row.published,
  };
}

function sortEntries(entries: FaqEntry[]): FaqEntry[] {
  return [...entries].sort((a, b) => a.sortOrder - b.sortOrder);
}

function defaultFaqContent(): FaqContent {
  return { ...DEFAULT_FAQ_CONTENT, entries: [...DEFAULT_FAQ_CONTENT.entries] };
}

function isFaqStorageUnavailable(message: string): boolean {
  return (
    /faq_page/i.test(message) ||
    /faq_entries/i.test(message) ||
    /schema cache/i.test(message)
  );
}

export async function loadFaqContent(): Promise<FaqContent> {
  if (!isSupabaseConfigured()) {
    return defaultFaqContent();
  }

  const supabase = createSupabaseAdmin();
  const [pageResult, entriesResult] = await Promise.all([
    supabase
      .from("faq_page")
      .select("title, intro")
      .eq("id", FAQ_PAGE_ID)
      .maybeSingle(),
    supabase
      .from("faq_entries")
      .select("id, question, answer, sort_order, published")
      .eq("page_id", FAQ_PAGE_ID)
      .order("sort_order", { ascending: true }),
  ]);

  if (pageResult.error) {
    if (isFaqStorageUnavailable(pageResult.error.message)) {
      console.warn("FAQ tables unavailable; using defaults.", pageResult.error.message);
      return defaultFaqContent();
    }
    throw new Error(`Failed to load FAQ page: ${pageResult.error.message}`);
  }
  if (entriesResult.error) {
    if (isFaqStorageUnavailable(entriesResult.error.message)) {
      console.warn("FAQ tables unavailable; using defaults.", entriesResult.error.message);
      return defaultFaqContent();
    }
    throw new Error(`Failed to load FAQ entries: ${entriesResult.error.message}`);
  }

  if (!pageResult.data) {
    return defaultFaqContent();
  }

  const page = pageResult.data as FaqPageRow;
  const entries = (entriesResult.data ?? []).map((row) =>
    mapEntryRow(row as FaqEntryRow),
  );

  return {
    title: page.title,
    intro: page.intro,
    entries: entries.length > 0 ? entries : [...DEFAULT_FAQ_CONTENT.entries],
  };
}

export async function loadPublishedFaqContent(): Promise<FaqContent> {
  const content = await loadFaqContent();
  return {
    ...content,
    entries: sortEntries(content.entries.filter((entry) => entry.published)),
  };
}

export async function saveFaqContent(content: FaqContent): Promise<FaqContent> {
  const title = content.title.trim();
  if (!title) {
    throw new Error("FAQ title is required.");
  }

  const entries = sortEntries(
    content.entries.map((entry, index) => ({
      ...entry,
      question: entry.question.trim(),
      answer: entry.answer.trim(),
      sortOrder: index,
    })),
  );

  for (const entry of entries) {
    if (!entry.question || !entry.answer) {
      throw new Error("Each FAQ entry needs a question and answer.");
    }
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const supabase = createSupabaseAdmin();
  const timestamp = new Date().toISOString();

  const { error: pageError } = await supabase.from("faq_page").upsert(
    {
      id: FAQ_PAGE_ID,
      title,
      intro: content.intro,
      updated_at: timestamp,
    },
    { onConflict: "id" },
  );

  if (pageError) {
    throw new Error(`Failed to save FAQ page: ${pageError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("faq_entries")
    .delete()
    .eq("page_id", FAQ_PAGE_ID);

  if (deleteError) {
    throw new Error(`Failed to clear FAQ entries: ${deleteError.message}`);
  }

  if (entries.length > 0) {
    const rows = entries.map((entry) => ({
      page_id: FAQ_PAGE_ID,
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      sort_order: entry.sortOrder,
      published: entry.published,
      updated_at: timestamp,
    }));

    const { error: insertError } = await supabase.from("faq_entries").insert(rows);
    if (insertError) {
      throw new Error(`Failed to save FAQ entries: ${insertError.message}`);
    }
  }

  return {
    title,
    intro: content.intro,
    entries,
  };
}
