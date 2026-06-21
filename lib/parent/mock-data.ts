export type PendingSubmission = {
  id: string;
  title: string;
  submittedAt: string;
  preview: string;
};

/** @deprecated Use family mock students via ActiveStudentProvider */
export const MOCK_STUDENT = {
  name: "Alex",
  grade: "B+",
  gradePercent: 87,
  courseName: "YSG Life Science · Chapter 2",
  courseProgress: 66,
};

export const MOCK_PENDING_SUBMISSIONS: PendingSubmission[] = [
  {
    id: "sub-1",
    title: "Photosynthesis explanation",
    submittedAt: "May 17, 2026 · 4:32 PM",
    preview:
      "Plants need sunlight because it gives energy to make glucose. Chlorophyll captures light and the plant releases oxygen as a byproduct...",
  },
  {
    id: "sub-2",
    title: "Cell structure reflection",
    submittedAt: "May 14, 2026 · 6:10 PM",
    preview:
      "The cell wall protects the plant cell and keeps its shape. Without it, the cell would not stay rigid when water enters...",
  },
];

export const MOCK_RUBRIC = [
  { criterion: "Scientific accuracy", maxPoints: 4 },
  { criterion: "Uses evidence from the lesson", maxPoints: 3 },
  { criterion: "Clear explanation in own words", maxPoints: 3 },
];

export const MOCK_BILLING = {
  plan: "YSG Physics 101",
  expiresOn: "August 15, 2026",
  status: "Active",
};
