import type { Metadata } from "next";

import { StudentLesson } from "@/components/lesson/student-lesson";
import { getCourse, getLesson } from "@/lib/student/curriculum";

type PageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const lesson = getLesson(courseId, lessonId);
  const course = getCourse(courseId);
  return {
    title: lesson ? `${lesson.title} · ${course?.title ?? "Course"}` : "Lesson",
    description: lesson?.description,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  return <StudentLesson courseId={courseId} lessonId={lessonId} />;
}
