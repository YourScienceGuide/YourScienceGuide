import { encodeAssessmentPayload } from "@/lib/ai-guard/encode";
import { ALCUMUS_PROBLEMS } from "@/lib/lesson/alcumus-problems.server";
import { LESSON_QUESTIONS } from "@/lib/lesson/questions.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = encodeAssessmentPayload({
    lesson: LESSON_QUESTIONS,
    alcumus: ALCUMUS_PROBLEMS,
  });

  return Response.json(
    { p: payload },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-YSG-Assessment": "protected",
      },
    },
  );
}
