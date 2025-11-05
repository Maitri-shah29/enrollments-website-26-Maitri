"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import createFormSubmission from "@/app/actions/create-form-submission";
import createResponse from "@/app/actions/create-response";
import ensureRoundUser from "@/app/actions/ensure-round-user";
// import type { Question } from "@prisma/client";
import type { QuestionWithRelations as Question } from "@/lib/types";

//this page has very disgusting ai code, this will be refactored if we decide to have another form round
//all of the code to rearrange the the questions object to work with the ui. I dont wanna rewrite rendering logic fml
interface QuestionsProps {
  questions: Question[];
  roundId: string;
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

const Questions: React.FC<QuestionsProps> = ({ questions, roundId }) => {
  const [roundUserId, setRoundUserId] = useState<string | null>(null);
  const [formSubmissionId, setFormSubmissionId] = useState<string | null>(null);

  const aoiData = useMemo(
    () => groupQuestionsByVarName(questions),
    [questions],
  );

  // Ensure round user exists when component mounts
  useEffect(() => {
    const ensureUser = async () => {
      const result = await ensureRoundUser(roundId);
      if ("success" in result && result.success) {
        setRoundUserId(result.roundUserId);
        console.log("Round user ensured:", result.roundUserId);
      } else if ("error" in result) {
        console.error("Failed to ensure round user:", result.error);
      }
    };

    ensureUser();
  }, [roundId]);

  // Create form submission after round user is ensured
  useEffect(() => {
    const setupFormSubmission = async () => {
      if (roundUserId) {
        const res = await createFormSubmission(roundId);
        if ("success" in res && res.formSubmission) {
          setFormSubmissionId(res.formSubmission.id);
          console.log(
            "Form submission created/fetched:",
            res.formSubmission.id,
          );
          if ("alreadySubmitted" in res && res.alreadySubmitted) {
            console.log("User already has a form submission for this round");
          }
        } else if ("error" in res) {
          console.error("Failed to create form submission:", res.error);
        }
      }
    };

    setupFormSubmission();
  }, [roundUserId, roundId]);

  const [selectedAoi, setSelectedAoi] = useState<AOIData | null>(
    aoiData[0] || null,
  );
  const [selectedQuestion, setSelectedQuestion] =
    useState<TransformedQuestion | null>(aoiData[0]?.questions[0] || null);
  const [isSaving, setIsSaving] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({}); //im starting to like this syntax ngl

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
    <div className="h-full w-screen flex items-center flex-col">
      <h1 className="text-[10vh] font-brushwell text-[#F55F4B] m-0 p-0">
        Questions
      </h1>
      <div className="flex w-full px-15 gap-10">
        <div className="w-[20%]">
          <div className="relative mb-8">
            <div className="absolute bottom-[-10px] right-[-10px] w-full h-full rounded-xl border-2 border-[#43A363]/60"></div>
            <div className="bg-[#43A363] p-6 rounded-xl flex flex-col gap-2">
              {aoiData.map((aoi) => (
                <div
                  className="flex gap-5 items-center cursor-pointer z-100"
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
                  className="flex gap-5 items-center cursor-pointer z-100"
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

        <div className="w-full h-full bg-[#302E2E] rounded-xl p-10 text-white flex flex-col">
          {selectedQuestion ? (
            <div className="flex flex-col flex-1">
              <h2 className="text-xl font-georgia mb-1 font-bold text-[#EA86B5]">
                {selectedQuestion.header}
              </h2>
              <p className="text-lg font-georgia">{selectedQuestion.content}</p>
              <div className="h-[1px] my-5 w-full bg-white"></div>
              <h2 className="text-xl font-georgia mb-1 font-bold text-[#EA86B5]">
                Answer
              </h2>

              <div className="flex-1">
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
