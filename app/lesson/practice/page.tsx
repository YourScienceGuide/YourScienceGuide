import type { Metadata } from "next";

import { ExtraPracticePage } from "@/components/lesson/extra-practice-page";

export const metadata: Metadata = {
  title: "Extra Practice",
  description:
    "Adaptive extra practice with mastery progress, separate from the main lesson.",
};

export default function ExtraPracticeRoute() {
  return <ExtraPracticePage />;
}
