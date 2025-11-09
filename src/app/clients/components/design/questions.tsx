"use client";
import type { Question } from "@prisma/client";
import { debounce } from "lodash";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import createResponse from "@/app/actions/create-response";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import type { DesignAOI } from "@/lib/types";

//this page has a bit of ai code to accommodate the fe, dont have enough time to actually think abt ts claude is pretty goog tho ngl
interface QuestionsProps {
  questions: Question[];
  roundUser: RoundUserExtended;
  joinedAOIs: Set<DesignAOI>;
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

interface Toast {
  message: string;
  type: "success" | "error";
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
  roundUser,
  joinedAOIs,
}) => {
  // Map DesignAOI to varName prefixes (these should match the question varNames in your database)
  const designAOIToVarName: Record<DesignAOI, string> = {
    uiux: "uiux",
    videoediting: "videoediting",
    illustrations: "illustrations",
    motiongraphics: "motiongraphics",
    "3d": "3d",
  };

  // Filter questions based on joined AOIs
  const filteredQuestions = useMemo(() => {
    if (joinedAOIs.size === 0) {
      return [];
    }

    const allowedVarNames = new Set<string>();
    // Always include common questions if any AOI is joined
    allowedVarNames.add("common");

    for (const aoi of joinedAOIs) {
      allowedVarNames.add(designAOIToVarName[aoi]);
    }

    return questions.filter((q) =>
      Array.from(allowedVarNames).some((varName) =>
        q.varName?.toLowerCase().includes(varName.toLowerCase()),
      ),
    );
  }, [questions, joinedAOIs]);

  const aoiData = useMemo(
    () => groupQuestionsByVarName(filteredQuestions),
    [filteredQuestions],
  );

  const [selectedAoi, setSelectedAoi] = useState<AOIData | null>(
    aoiData[0] || null,
  );
  const [selectedQuestion, setSelectedQuestion] =
    useState<TransformedQuestion | null>(aoiData[0]?.questions[0] || null);
  const [isSaving, setIsSaving] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({}); //im starting to like this syntax ngl
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast(null);
      }, 3000);
    },
    [],
  );

  const formSubmissionId = roundUser?.formSubmission?.id || null;
  const savedResponses = roundUser?.formSubmission?.responses || [];

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

  const saveResponse = useCallback(
    async (questionId: string, currentAnswer: string) => {
      if (!formSubmissionId || !questionId) {
        console.error("Missing required data to save response");
        return;
      }
      if (!currentAnswer.trim()) {
        console.log("Answer is empty, skipping save");
        return;
      }
      try {
        await createResponse(questionId, formSubmissionId, currentAnswer);
        console.log(`Response for ${questionId} saved successfully`);
      } catch (error) {
        console.error(`Failed to save response for ${questionId}:`, error);
      }
    },
    [formSubmissionId],
  );

  const debouncedSave = useMemo(
    () => debounce(saveResponse, 1000),
    [saveResponse],
  );
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleAoiClick = (aoi: AOIData) => {
    if (selectedQuestion) {
      debouncedSave(
        selectedQuestion.questionId,
        answers[selectedQuestion.questionId] || "",
      );
    }
    setSelectedAoi(aoi);
    setSelectedQuestion(aoi.questions[0]);
  };

  const handleQuestionClick = (question: TransformedQuestion) => {
    if (selectedQuestion) {
      debouncedSave(
        selectedQuestion.questionId,
        answers[selectedQuestion.questionId] || "",
      );
    }
    setSelectedQuestion(question);
  };

  const handleSaveResponse = useCallback(async () => {
    if (!formSubmissionId || !selectedQuestion) {
      console.error("Missing required data to save response");
      showToast("Submission failed: Missing form or question data.", "error");
      return;
    }

    const currentAnswer = answers[selectedQuestion.questionId] || "";
    if (!currentAnswer.trim()) {
      console.error("Answer is empty");
      showToast("Submission failed: Please provide an answer.", "error");
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
      showToast("Response submitted successfully!", "success");
    } catch (error) {
      console.error("Failed to save response:", error);
      showToast("Submission failed: An error occurred.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [formSubmissionId, selectedQuestion, answers, showToast]);

  const getToastClasses = (type: "success" | "error") => {
    return type === "success"
      ? "bg-green-500 border-green-700"
      : "bg-red-500 border-red-700";
  };

  // If no AOIs are joined, show a message
  if (joinedAOIs.size === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
        <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
          Questions
        </h1>
        <div className="text-white text-center max-w-2xl px-8">
          <p className="text-2xl font-coolvetica mb-4">No AOIs Selected</p>
          <p className="text-lg font-coolvetica text-white/70">
            Please visit the AOIs page to join at least one Area of Interest to
            access questions.
          </p>
        </div>
      </div>
    );
  }

  // If no questions available for joined AOIs
  if (aoiData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
        <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
          Questions
        </h1>
        <div className="text-white text-center max-w-2xl px-8">
          <p className="text-2xl font-coolvetica mb-4">
            No Questions Available
          </p>
          <p className="text-lg font-coolvetica text-white/70">
            No questions found for your joined AOIs. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-[3%]">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[1000] p-4 rounded-lg shadow-xl text-white font-coolvetica transition-opacity duration-300 ${getToastClasses(
            toast.type,
          )} border-2`}
        >
          {toast.message}
        </div>
      )}
      <h1 className="text-[8vh] lg:text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0 mb-[1.5%]">
        Questions
      </h1>
      <div className="flex flex-col lg:flex-row w-full px-[3%] gap-[3%]">
        <div className="w-full lg:w-[25%] mb-[3%] lg:mb-0">
          <div className="relative mb-4 lg:mb-8">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#43A363]/60"></div>
            <div className="bg-[#43A363] p-4 lg:p-6 rounded-xl flex flex-col gap-2">
              {aoiData.map((aoi) => (
                <button
                  type="button" // Important for buttons not in a form
                  className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100 w-full p-0 border-none bg-transparent text-white text-left"
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
                    className={`font-coolvetica truncate ${
                      selectedAoi?.name === aoi.name ? "font-bold" : ""
                    }`}
                  >
                    {aoi.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#3389E5]/60"></div>
            <div className="bg-[#3389E5] p-8 rounded-xl flex flex-col gap-2">
              {selectedAoi?.questions.map((question) => (
                // 🐛 FIX 1: Use <button> for clickable items
                <button
                  type="button" // Important for buttons not in a form
                  className="flex gap-3 lg:gap-5 items-center cursor-pointer z-100 w-full p-0 border-none bg-transparent text-white text-left"
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
                    className={`font-coolvetica truncate ${
                      selectedQuestion?.header === question.header
                        ? "font-bold"
                        : ""
                    }`}
                  >
                    {question.header}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-full min-h-140 bg-[#302E2E] rounded-xl p-10 text-white flex flex-col">
          {selectedQuestion ? (
            <div className="flex flex-col flex-1">
              <h2 className="text-lg lg:text-xl font-coolvetica mb-1 font-bold text-[#EA86B5]">
                {selectedQuestion.header}
              </h2>
              <p className="text-base lg:text-lg font-coolvetica">
                {selectedQuestion.content}
              </p>
              <div className="h-[1px] my-3 lg:my-5 w-full bg-white"></div>
              <h2 className="text-lg lg:text-xl font-coolvetica mb-1 font-bold text-[#EA86B5]">
                Answer
              </h2>

              <div className="flex-1 min-h-[200px]">
                <textarea
                  value={answers[selectedQuestion.questionId] || ""}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length > 1500) return;

                    const questionId = selectedQuestion.questionId;
                    const newAnswer = e.target.value;
                    setAnswers((prev) => ({
                      ...prev,
                      [questionId]: newAnswer,
                    }));

                    debouncedSave(questionId, newAnswer);
                  }}
                  className="
                        w-full h-full
                        resize-none
                        bg-transparent
                        font-coolvetica
                        text-white
                        text-sm lg:text-base
                        outline-none
                        border-none
                        selection:bg-transparent selection:text-[#EA86B5]
                      "
                  placeholder="Type your answer here..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {1500 - (answers[selectedQuestion.questionId]?.length ?? 0)}{" "}
                characters left
              </p>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveResponse}
                  disabled={
                    isSaving ||
                    !answers[selectedQuestion.questionId]?.trim() ||
                    !formSubmissionId
                  }
                  className="px-10 py-4 border-2 border-white font-coolvetica rounded-lg hover:bg-[#F55F4B] hover:border-[#F55F4B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-white"
                >
                  {isSaving ? "Saving..." : "Submit"}
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
