import type { Prisma } from "@prisma/client";

export type AOI = "app" | "web" | "gamedev" | "foss" | "devops";
export type Section =
  | "welcome"
  | "about"
  | "aoi"
  | "explore"
  | "instructions"
  | "round1";

export type QuestionId =
  | "question1"
  | "question2"
  | "question3"
  | "question4"
  | "question5"
  | "question6"
  | "question7"
  | "question8"
  | "question9"
  | "question10";

export type QuestionsData = Record<
  string,
  Record<number, { title: string; description: string }>
>;
export interface UserAuthDisplayProps {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  onLogin?: () => void;
}

export type QuestionWithRelations = Prisma.QuestionGetPayload<{
  include: {
    round: true;
    // responses: true;
    validators: true;
  };
}>;
