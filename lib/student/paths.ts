export function coursePath(courseId: string) {
  return `/student/${courseId}`;
}

export function lessonPath(courseId: string, lessonId: string) {
  return `/student/${courseId}/${lessonId}`;
}

export function lessonPracticePath(courseId: string, lessonId: string) {
  return `/student/${courseId}/${lessonId}/practice`;
}

export function lessonFlashcardsPath(courseId: string, lessonId: string) {
  return `/student/${courseId}/${lessonId}/flashcards`;
}
