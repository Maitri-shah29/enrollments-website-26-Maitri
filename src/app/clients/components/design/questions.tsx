"use client";
import type { Response } from "@prisma/client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import createResponse from "@/app/actions/create-response";
// import type { Question } from "@prisma/client";
import type { QuestionWithRelations as Question } from "@/lib/types";

//this page has a bit of ai code to accommodate the fe, dont have enough time to actually think abt ts claude is pretty goog tho ngl
interface QuestionsProps {
  questions: Question[];
  roundId: string;
  formSubmissionId: string | null;
  savedResponses: Response[];
}

interface TransformedQuestion {
  header: string;
  content: string;
  questionId: string; // Added to track question ID for responses
}

interface AOIData {
  name: string;
  questions: TransformedQuestion[];
}

const groupQuestionsByVarName = (questions: Question[]): AOIData[] => {
  const grouped = questions.reduce(
    (acc, question) => {
      const varName = question.varName;
      if (!acc[varName]) {
        acc[varName] = [];
      }
      acc[varName].push(question);
      return acc;
    },
    {} as Record<string, Question[]>,
  );

  return Object.entries(grouped).map(([varName, questions]) => ({
    name: varName,
    questions: questions
      .sort((a, b) => a.serial - b.serial)
      .map((q) => ({
        header: `Question ${q.serial}`,
        content: q.question,
        questionId: q.id, // Include question ID
      })),
  }));
};

const Questions: React.FC<QuestionsProps> = ({
  questions,
  roundId,
  formSubmissionId,
  savedResponses,
}) => {
  const aoiData = useMemo(
    () => groupQuestionsByVarName(questions),
    [questions],
  );

  const [selectedAoi, setSelectedAoi] = useState<AOIData | null>(
    aoiData[0] || null,
  );
  const [selectedQuestion, setSelectedQuestion] =
    useState<TransformedQuestion | null>(aoiData[0]?.questions[0] || null);
  const [isSaving, setIsSaving] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({}); //im starting to like this syntax ngl

  // Load saved responses into answers state
  useEffect(() => {
    if (savedResponses.length > 0) {
      const loadedAnswers: Record<string, string> = {};
      for (const response of savedResponses) {
        if (response.response) {
          loadedAnswers[response.questionId] = response.response;
        }
      }
      setAnswers(loadedAnswers);
      console.log("Loaded answers from saved responses:", loadedAnswers);
    }
  }, [savedResponses]);

  const handleAoiClick = (aoi: AOIData) => {
    setSelectedAoi(aoi);
    setSelectedQuestion(aoi.questions[0]);
  };

  const handleQuestionClick = (question: TransformedQuestion) => {
    setSelectedQuestion(question);
  };

  const handleSaveResponse = async () => {
    if (!formSubmissionId || !selectedQuestion) {
      console.error("Missing required data to save response");
      return;
    }

    const currentAnswer = answers[selectedQuestion.questionId] || "";
    if (!currentAnswer.trim()) {
      console.error("Answer is empty");
      return;
    }

    try {
      setIsSaving(true);
      await createResponse(
        selectedQuestion.questionId,
        formSubmissionId,
        currentAnswer,
      );
      console.log("Response saved successfully");
    } catch (error) {
      console.error("Failed to save response:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center flex-col">
      <h1 className="text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0">
        Questions
      </h1>
      <div className="flex flex-col lg:flex-row w-full px-[3%] gap-[3%]">
        <div className="w-full lg:w-[25%] mb-[3%] lg:mb-0">
          <div className="relative mb-4 lg:mb-8">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#43A363]/60"></div>
            <div className="bg-[#43A363] p-4 lg:p-6 rounded-xl flex flex-col gap-2">
              {aoiData.map((aoi) => (
                <div
                  className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100"
                  key={aoi.name}
                  onClick={() => handleAoiClick(aoi)}
                >
                  <div
                    className={`w-6 aspect-square rounded-sm ${
                      selectedAoi?.name === aoi.name
                        ? "bg-[#1A1A1A]"
                        : "bg-white"
                    }`}
                  ></div>
                  <p
                    className={`font-georgia truncate ${
                      selectedAoi?.name === aoi.name ? "font-bold" : ""
                    }`}
                  >
                    {aoi.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#3389E5]/60"></div>
            <div className="bg-[#3389E5] p-8 rounded-xl flex flex-col gap-2">
              {selectedAoi?.questions.map((question) => (
                <div
                  className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100"
                  key={question.header}
                  onClick={() => handleQuestionClick(question)}
                >
                  <div
                    className={`w-6 aspect-square rounded-sm ${
                      selectedQuestion?.header === question.header
                        ? "bg-[#1A1A1A]"
                        : "bg-white"
                    }`}
                  ></div>
                  <p
                    className={`font-georgia truncate ${
                      selectedQuestion?.header === question.header
                        ? "font-bold"
                        : ""
                    }`}
                  >
                    {question.header}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:flex-1 min-h-[60vh] lg:min-h-0 bg-[#302E2E] rounded-xl p-6 lg:p-10 text-white flex flex-col">
          {selectedQuestion ? (
            <div className="flex flex-col flex-1">
              <h2 className="text-lg lg:text-xl font-georgia mb-1 font-bold text-[#EA86B5]">
                {selectedQuestion.header}
              </h2>
              <p className="text-base lg:text-lg font-georgia">
                {selectedQuestion.content}
              </p>
              <div className="h-[1px] my-3 lg:my-5 w-full bg-white"></div>
              <h2 className="text-lg lg:text-xl font-georgia mb-1 font-bold text-[#EA86B5]">
                Answer
              </h2>

              <div className="flex-1 min-h-[200px]">
                <textarea
                  value={answers[selectedQuestion.questionId] || ""}
                  onChange={(e) => {
                    setAnswers((prev) => ({
                      ...prev,
                      [selectedQuestion.questionId]: e.target.value,
                    }));
                  }}
                  className="
                        w-full h-full
                        resize-none
                        bg-transparent
                        font-georgia
                        text-white
                        text-sm lg:text-base
                        outline-none
                        border-none
                        selection:bg-transparent selection:text-[#EA86B5]
                      "
                  placeholder="Type your answer here..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveResponse}
                  disabled={
                    isSaving ||
                    !answers[selectedQuestion.questionId]?.trim() ||
                    !formSubmissionId
                  }
                  className="px-10 py-4 border-2 border-white font-georgia rounded-lg "
                >
                  {isSaving ? "Saving..." : "Save Answer"}
                </button>
              </div>
            </div>
          ) : (
            <p>No question selected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questions;
