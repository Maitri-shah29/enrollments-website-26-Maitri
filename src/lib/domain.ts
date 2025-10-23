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

// Clone rounds while preserving any extra metadata on the round object (e.g., validators)
export function cloneRounds<T extends Round>(src: T[]): T[] {
  return src.map((r) => ({
    // Preserve all existing round-level fields (like validators), but reset question answers
    ...(r as T),
    questions: r.questions.map((q) => ({ question: q.question, answer: "" })),
  }));
}
