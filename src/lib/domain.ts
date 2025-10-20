export const DOMAINS = [
  "tech",
  "managment",
  "research",
  "cc",
  "desgin",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  tech: "Tech",
  managment: "Management",
  research: "Research",
  cc: "CC",
  desgin: "Design",
};

export interface RoundQuestion {
  question: string;
  answer: string;
}

export interface Round {
  title: string;
  questions: RoundQuestion[];
}

export function cloneRounds(src: Round[]): Round[] {
  return src.map((r) => ({
    title: r.title,
    questions: r.questions.map((q) => ({ question: q.question, answer: "" })),
  }));
}
