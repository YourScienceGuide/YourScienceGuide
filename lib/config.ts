/** Application-wide configuration. */

/** Maximum lesson video upload size in megabytes. */
export const MAX_VIDEO_UPLOAD_MB = 500;

export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;

/** Used to verify deployed admin bundles include Mux uploads (search page source). */
export const VIDEO_UPLOAD_MODE = "mux" as const;
