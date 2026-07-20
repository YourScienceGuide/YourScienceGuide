/**
 * Non-production deploy label for the site header.
 * - Vercel production → null (hidden)
 * - Vercel preview/dev → git branch name
 * - Local → "localhost"
 */
export function getHeaderEnvLabel(
  env: {
    vercelEnv?: string;
    gitCommitRef?: string;
  } = {
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    gitCommitRef: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
  },
): string | null {
  const vercelEnv = env.vercelEnv?.trim();
  if (vercelEnv === "production") return null;

  if (vercelEnv) {
    const branch = env.gitCommitRef?.trim();
    return branch || vercelEnv;
  }

  return "localhost";
}
