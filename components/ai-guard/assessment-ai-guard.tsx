import { AcknowledgmentCheckpoint } from "@/components/ai-guard/acknowledgment-checkpoint";
import { ContentIntegrity } from "@/components/ai-guard/content-integrity";

/**
 * Hidden AI guard blocks (Coursera-style). Not visible to students.
 */
export function AssessmentAiGuard() {
  return (
    <>
      <ContentIntegrity />
      <AcknowledgmentCheckpoint />
    </>
  );
}
