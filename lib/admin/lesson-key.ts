export function lessonKey(courseId: string, lessonId: string) {
  return `${courseId}/${lessonId}`;
}

export function slugifyId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
