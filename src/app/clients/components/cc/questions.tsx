"use client";
import type { Prisma } from "@prisma/client";
import { useEffect, useState } from "react";
import AnswerBox from "./answer-box";
import Button from "./button";
import QuestionBox from "./question-box";
import QuestionList from "./question-list";

export type RoundUserExtended = Prisma.RoundUserGetPayload<{
  include: {
    round: {
      select: {
        id: true;
        number: true;
        domain: true;
        active: true;
        type: true;
        eliminates: true;
        announced: true;
        hidden: true;
        Question: true;
      };
    };
    formSubmission: {
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        formSubmittedAt: true;
        valid: true;
        responses: {
          select: {
            id: true;
            questionId: true;
            response: true;
            error: true;
            updatedAt: true;
          };
        };
      };
    };
    Task: true;
    Meet_User: true;
    user: true;
  };
}>;

type QuestionsProps = {
  roundUser?: RoundUserExtended;
};

// Sample data for testing
const sampleRoundUser: RoundUserExtended = {
  id: "sample-round-user-id",
  roundId: "sample-round-id",
  userId: "sample-user-id",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  taskId: null,
  round: {
    id: "sample-round-id",
    number: 1,
    domain: "cc",
    active: true,
    type: "form",
    eliminates: false,
    announced: true,
    hidden: false,
    Question: [
      {
        id: "q1",
        serial: 1,
        question: "What is your name?",
        helpText:
          "Please provide your full name as it appears on official documents.",
        roundId: "sample-round-id",
        type: "stq",
        options: [],
        varName: "Hard",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "q2",
        serial: 2,
        question: "Why do you want to join ACM VIT?",
        helpText:
          "Please provide a detailed answer explaining your motivation and goals.",
        roundId: "sample-round-id",
        type: "ltq",
        options: [],
        varName: "Easy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "q3",
        serial: 3,
        question: "What is your programming experience?",
        helpText: "Select your level of programming experience.",
        roundId: "sample-round-id",
        type: "stq",
        options: ["Beginner", "Intermediate", "Advanced", "Expert"],
        varName: "Medium",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  formSubmission: {
    id: "sample-form-submission-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    formSubmittedAt: null,
    valid: false,
    responses: [
      {
        id: "r1",
        questionId: "q1",
        response: "John Doe",
        error: null,
        updatedAt: new Date(),
      },
    ],
  },
  Task: null,
  Meet_User: null,
  user: {
    id: "sample-user-id",
    name: "John Doe",
    email: "john.doe@example.com",
    emailVerified: false,
    image: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const Questions = ({ roundUser = sampleRoundUser }: QuestionsProps) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roundUser.formSubmission?.responses) {
      const initialResponses: Record<string, string> = {};
      roundUser.formSubmission.responses.forEach((response) => {
        if (response.response) {
          initialResponses[response.questionId] = response.response;
        }
      });
      setResponses(initialResponses);
    }
  }, [roundUser.formSubmission?.responses]);

  useEffect(() => {
    const subjectiveQuestions = roundUser.round.Question.filter(
      (question) => question.type === "stq" || question.type === "ltq",
    );
    if (subjectiveQuestions.length > 0 && !activeQuestionId) {
      setActiveQuestionId(subjectiveQuestions[0].id);
    }
  }, [roundUser.round.Question, activeQuestionId]);

  const handleQuestionSelect = (questionId: string) => {
    setActiveQuestionId(questionId);
  };

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const subjectiveQuestions = roundUser.round.Question.filter(
    (question) => question.type === "stq" || question.type === "ltq",
  );

  const questionsForList = subjectiveQuestions.map((question) => ({
    id: question.id,
    serial: question.serial,
    title: question.question,
    difficulty: question.varName, // use varname for difficulty
  }));

  const activeQuestion = subjectiveQuestions.find(
    (q) => q.id === activeQuestionId,
  );

  const currentResponse = activeQuestionId
    ? responses[activeQuestionId] || ""
    : "";

  return (
    <div className="flex flex-col space-y-6 h-screen">
      {subjectiveQuestions.length === 0 ? (
        <div className="text-white text-lg text-center py-8">
          No subjective questions available for this round.
        </div>
      ) : (
        <div className="flex space-x-20 min-h-screen">
          <div className="w-[30%]">
            <QuestionList
              questions={questionsForList}
              onQuestionSelect={handleQuestionSelect}
              activeQuestionId={activeQuestionId}
            />
          </div>

          <div className="w-[60%] flex flex-row max-h-screen">
            {activeQuestion ? (
              <div className="w-full flex flex-col h-[55%] space-y-3">
                <div className="h-[25%]">
                  <QuestionBox
                    subject={activeQuestion.question}
                    body={activeQuestion.helpText || ""}
                  />
                </div>
                <div className="h-[85%]">
                  <AnswerBox
                    key={activeQuestion.id}
                    subject="Answer"
                    body={currentResponse}
                    language="plaintext"
                    onChange={(value) =>
                      activeQuestionId &&
                      handleResponseChange(activeQuestionId, value)
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button label="Submit" />
                </div>
              </div>
            ) : (
              <div className="text-white text-lg">
                Select a question to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
