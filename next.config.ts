import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
