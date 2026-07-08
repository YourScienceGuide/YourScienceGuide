type RecordFlashcardStudyInput = {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  cardId: string;
  frontText: string;
  isCorrect: boolean;
};

type SaveFlashcardDefinitionInput = {
  familyStudentId: string;
  courseId: string;
  lessonId: string;
  cardId: string;
  frontText: string;
  definition: string;
};

async function postFlashcardProgress(body: Record<string, unknown>) {
  const res = await fetch("/api/student/flashcard-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to save flashcard progress");
  }
}

export async function recordFlashcardStudyEventClient(
  input: RecordFlashcardStudyInput,
): Promise<void> {
  await postFlashcardProgress({
    ...input,
    eventType: "study",
  });
}

export async function saveFlashcardDefinitionClient(
  input: SaveFlashcardDefinitionInput,
): Promise<void> {
  await postFlashcardProgress({
    ...input,
    eventType: "definition",
  });
}
