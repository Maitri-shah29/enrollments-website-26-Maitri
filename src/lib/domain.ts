export const DOMAINS = [
  "tech",
  "management",
  "research",
  "cc",
  "design",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  tech: "Tech",
  management: "Management",
  research: "Research",
  cc: "CC",
  design: "Design",
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
