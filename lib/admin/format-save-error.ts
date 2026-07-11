export type FormattedSaveError = {
  message: string;
  tips: string[];
};

const OFFLINE_PATTERNS = [
  /^failed to fetch$/i,
  /^networkerror/i,
  /network request failed/i,
  /load failed/i,
  /fetch failed/i,
  /internet connection/i,
  /network connection/i,
];

const GENERIC_SAVE_PATTERNS = [
  /^failed to save content$/i,
  /^failed to reset content$/i,
  /^failed to load content$/i,
];

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  if (typeof error === "string") return error.trim();
  return "Something went wrong";
}

export function isOfflineErrorMessage(message: string): boolean {
  return OFFLINE_PATTERNS.some((pattern) => pattern.test(message));
}

export function formatSaveError(error: unknown): FormattedSaveError {
  const raw = normalizeErrorMessage(error);

  if (isOfflineErrorMessage(raw)) {
    return {
      message: "No connection — check your internet connection.",
      tips: [
        "Make sure you are connected to Wi‑Fi or cellular data.",
        "Try refreshing the page, then click Save Changes again.",
        "Your edits are still on this page until you leave or discard them.",
      ],
    };
  }

  if (GENERIC_SAVE_PATTERNS.some((pattern) => pattern.test(raw))) {
    return {
      message: "We couldn't save your changes.",
      tips: [
        "Check your internet connection and try again.",
        "Wait a moment, then click Save Changes once more.",
        "Your edits remain on this page — nothing was lost.",
      ],
    };
  }

  return {
    message: raw,
    tips: [
      "Check your connection and try Save Changes again.",
      "If this keeps happening, try signing out and back in.",
    ],
  };
}

export function toAdminErrorFeedback(error: unknown): {
  type: "error";
  message: string;
  tips: string[];
} {
  const formatted = formatSaveError(error);
  return {
    type: "error",
    message: formatted.message,
    tips: formatted.tips,
  };
}
