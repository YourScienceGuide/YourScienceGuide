export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
};

export type FaqContent = {
  title: string;
  intro: string;
  entries: FaqEntry[];
};
