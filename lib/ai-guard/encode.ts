export function encodeAssessmentPayload(data: unknown): string {
  return Buffer.from(JSON.stringify(data), "utf-8").toString("base64");
}

export function decodeAssessmentPayload<T>(encoded: string): T {
  const json = decodeBase64Utf8(encoded);
  return JSON.parse(json) as T;
}

export function decodeBase64Utf8(encoded: string): string {
  if (typeof window !== "undefined") {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export function toDisplayEncoding(text: string): string {
  if (typeof window !== "undefined") {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }
  return Buffer.from(text, "utf-8").toString("base64");
}

/** Breaks copy/paste and naive DOM scraping while looking normal on screen. */
export function insertCopyBreaks(text: string): string {
  return text.split("").join("\u200b");
}
