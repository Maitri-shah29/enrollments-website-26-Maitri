import type { AOI, QuestionId } from "./types";

export const aoiList: AOI[] = ["app", "web", "gamedev", "foss", "devops"];
export const round1Folders: AOI[] = ["app", "web", "gamedev", "foss", "devops"];
export const questionsList: QuestionId[] = [
  "question1",
  "question2",
  "question3",
  "question4",
  "question5",
  "question6",
  "question7",
  "question8",
  "question9",
  "question10",
];

const getDomainCap = (): number => {
  if (!process.env.NEXT_PUBLIC_DOMAIN_CAP) {
    console.error(
      "NEXT_PUBLIC_DOMAIN_CAP is not defined in environment variables. Please add it to your .env file."
    );
    throw new Error(
      "NEXT_PUBLIC_DOMAIN_CAP is not defined. Check console for details."
    );
  }
  return Number.parseInt(process.env.NEXT_PUBLIC_DOMAIN_CAP);
};

export const DOMAIN_CAP = getDomainCap();
