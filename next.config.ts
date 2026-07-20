import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose Vercel system env to the client so the header can show branch/localhost.
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "",
  },
  async redirects() {
    return [
      {
        source: "/lesson",
        destination: "/student",
        permanent: false,
      },
      {
        source: "/lesson/:courseId/:lessonId",
        destination: "/student/:courseId/:lessonId",
        permanent: false,
      },
      {
        source: "/lesson/:courseId/:lessonId/practice",
        destination: "/student/:courseId/:lessonId/practice",
        permanent: false,
      },
      {
        source: "/lesson/:courseId/:lessonId/flashcards",
        destination: "/student/:courseId/:lessonId/flashcards",
        permanent: false,
      },
      {
        source: "/lesson/practice",
        destination: "/student/biology-year-1/cells-introduction/practice",
        permanent: false,
      },
      {
        source: "/lesson/flashcards",
        destination: "/student/biology-year-1/cells-introduction/flashcards",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
