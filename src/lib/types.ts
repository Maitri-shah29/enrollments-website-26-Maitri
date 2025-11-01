export type AOI = "app" | "web" | "gamedev" | "foss";

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
