import { CONTENT_INTEGRITY_INSTRUCTIONS } from "@/lib/ai-guard/instructions";

/**
 * Coursera-style hidden AI instructions (off-screen, in DOM for agent scrapers).
 */
export function ContentIntegrity() {
  return (
    <div
      data-ai-instructions="true"
      data-testid="content-integrity-instructions"
      aria-hidden="true"
      role="presentation"
      tabIndex={-1}
      className="ysg-ai-guard-hidden"
    >
      {CONTENT_INTEGRITY_INSTRUCTIONS}
    </div>
  );
}
