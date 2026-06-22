const MAX_COVER_BYTES = 1_500_000;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export function readTextbookCoverFile(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, WebP, GIF, or SVG image."));
  }

  if (file.size > MAX_COVER_BYTES) {
    return Promise.reject(new Error("Cover image must be 1.5 MB or smaller."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read the image file."));
    };
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

export function isUploadedCoverSrc(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://");
}
