import type { Metadata } from "next";

import { CourseCurriculum } from "@/components/student/course-curriculum";
import { getCourse } from "@/lib/student/curriculum";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  return {
    title: course?.title ?? "Course",
    description: course?.description,
  };
}

export default async function CoursePage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseCurriculum courseId={courseId} />;
}
