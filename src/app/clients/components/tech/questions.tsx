"use client";
import { asciiArt } from "./ascii-art";
import TechButton from "./button";

type QuestionsData = Record<
  string,
  Record<number, { title: string; description: string }>
>;

type Props = {
  activeRoundFolder: string;
  activeQuestion: string;
  questionsData: QuestionsData;
  answers: Record<string, string>;
  submittedQuestions: Set<string>;
  onChangeAnswer: (key: string, value: string) => void;
  onSubmit: (key: string) => void;
};

export default function Questions({
  activeRoundFolder,
  activeQuestion,
  questionsData,
  answers,
  submittedQuestions,
  onChangeAnswer,
  onSubmit,
}: Props) {
  if (!activeRoundFolder) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold">
        <h1>Round 1 Overview</h1>
        <p className="mt-4 text-lg text-white">
          Choose a folder from the sidebar to get started.
        </p>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div className="text-[#993C7A] text-2xl font-semibold">
        <h1>{activeRoundFolder} </h1>
        <p className="mt-4 text-lg text-white">
          Select a question to get started with {""}
          {activeRoundFolder}.
        </p>
      </div>
    );
  }

  const questionNumber = Number(activeQuestion.replace("question", ""));
  const questionKey = `${activeRoundFolder}-${activeQuestion}`;
  const isSubmitted = submittedQuestions.has(questionKey);

  const currentQuestion = questionsData[activeRoundFolder]?.[questionNumber];
  const questionTitle = currentQuestion?.title || `Question ${questionNumber}`;
  const questionDescription =
    currentQuestion?.description ||
    "No description available for this question.";

  return (
    <div className="w-full h-full relative">
      <pre className="text-white font-mono text-sm leading-tight mb-8">
        {asciiArt[questionNumber] || `Question ${questionNumber}`}
      </pre>

      <div className="mt-8">
        <div className="text-[#993C7A] font-jetbrains text-sm mb-2">
          q{questionNumber}:\{questionTitle}
        </div>
        <div className="text-[#993C7A] font-jetbrains text-sm leading-relaxed mb-4">
          {questionDescription.split("\n").map((line, idx) => (
            <div key={idx} className="flex items-start gap-2 px-18">
              <span className="text-[#993C7A] select-none">{">"}</span>
              <span className="pl-3">{line}</span>
            </div>
          ))}
        </div>
        <div className="text-[#993C7A] font-jetbrains text-sm mb-2">
          q{questionNumber}:\ans
        </div>

        <div className="mb-8 px-18 flex items-start gap-2">
          <span className="text-[#993C7A] font-jetbrains text-sm select-none">
            {">"}
          </span>
          <textarea
            style={{ height: "calc(7 * 1.25rem)" }}
            className={`flex-1 bg-transparent text-[#E097CE] selection:bg-[#993C7A] selection:text-white font-jetbrains text-sm leading-5 pl-3 resize-none focus:outline-none focus:border-white transition-colors [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
              isSubmitted
                ? "border-gray-500 text-gray-500 cursor-not-allowed"
                : "border-[#993C7A]"
            }`}
            placeholder={
              isSubmitted ? "Answer submitted" : "Type your answer here..."
            }
            value={answers[questionKey] || ""}
            onChange={(e) => {
              if (!isSubmitted) onChangeAnswer(questionKey, e.target.value);
            }}
            onWheel={(e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const lineHeight = 20;
              const currentScroll = target.scrollTop;
              const direction = e.deltaY > 0 ? 1 : -1;
              const currentLine = Math.round(currentScroll / lineHeight);
              const nextLine = currentLine + direction;
              target.scrollTop = nextLine * lineHeight;
            }}
            disabled={isSubmitted}
            readOnly={isSubmitted}
          />
        </div>

        <div className="flex justify-end">
          <TechButton
            type="button"
            className={`bg-transparent border px-10 py-2 mt-6 font-jetbrains text-sm transition-colors ${
              isSubmitted
                ? "border-gray-500 text-gray-500 cursor-not-allowed"
                : "border-[#993C7A] hover:bg-[#993C7A]"
            }`}
            onClick={() => {
              if (!isSubmitted && (answers[questionKey] || "").trim()) {
                onSubmit(questionKey);
                console.log(
                  "Answer submitted for question",
                  questionNumber,
                  ":",
                  answers[questionKey],
                );
              }
            }}
            disabled={isSubmitted || !(answers[questionKey] || "").trim()}
          >
            {isSubmitted ? "submitted" : "submit"}
          </TechButton>
        </div>
      </div>
    </div>
  );
}
