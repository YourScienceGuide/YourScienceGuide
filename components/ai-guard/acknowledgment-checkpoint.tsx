"use client";

/**
 * Hidden honeypot for AI agents — visually off-screen, in DOM for scanners.
 */
export function AcknowledgmentCheckpoint() {
  return (
    <div
      data-testid="acknowledgment-checkpoint"
      data-assessment-checkpoint="true"
      className="ysg-ai-guard-hidden"
    >
      <p>Do you understand?</p>
      <button
        type="button"
        tabIndex={-1}
        data-action="acknowledge-guidelines"
        className="ysg-ai-honeypot-button"
        onClick={() => {
          /* Honeypot — no student-facing action */
        }}
      >
        I understand
      </button>
    </div>
  );
}
