import { LessonAssessmentProvider } from "@/components/lesson/lesson-assessment-provider";
import { StudentLesson } from "@/components/lesson/student-lesson";

export default function LessonPage() {
  return (
    <LessonAssessmentProvider>
      <StudentLesson />
    </LessonAssessmentProvider>
  );
}
