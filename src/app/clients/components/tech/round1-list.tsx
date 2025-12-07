"use client";
import Image from "next/image";
import React, { useMemo } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import type { AOI, QuestionId } from "@/lib/types";
import TechButton from "./button";

type Props = {
  activeRoundFolder: string | "";
  activeQuestion: QuestionId | "";
  onSelectFolder: (folder: string) => void;
  onSelectQuestion: (q: QuestionId) => void;
  submittedQuestions: Set<string>;
  roundUser?: RoundUserExtended | null;
  joinedAOIs: Set<AOI>;
  currentAnswers: Record<string, string>;
};

export default function Round1List({
  activeRoundFolder,
  activeQuestion,
  onSelectFolder,
  onSelectQuestion,
  submittedQuestions,
  roundUser,
  joinedAOIs,
  currentAnswers,
}: Props) {
  const availableFolders = useMemo(() => {
    const folders: string[] = Array.from(joinedAOIs);
    const hasCommon = (roundUser?.round?.Question || []).some(
      (q) => !q.varName || q.varName === "common",
    );
    if (hasCommon) folders.unshift("common");
    return folders;
  }, [joinedAOIs, roundUser?.round?.Question]);

  const getQuestionsForFolder = (folder: string): QuestionId[] => {
    if (!roundUser?.round?.Question) return [];
    const folderQuestions = roundUser.round.Question.filter((q) => {
      if (folder === "common") {
        return !q.varName || q.varName === "common";
      }
      return q.varName === folder;
    }).sort((a, b) => a.serial - b.serial);
    return folderQuestions.map(
      (_, index) => `question${index + 1}` as QuestionId,
    );
  };

  if (availableFolders.length === 0) {
    return (
      <div className="ml-4 mt-2 text-gray-400 text-sm py-2">
        No AOIs joined yet. Visit the Explore section to join AOIs.
      </div>
    );
  }

  return (
    <div className="ml-4 mt-2 flex flex-col gap-1 text-[#993C7A] text-sm">
      {availableFolders.map((folder) => {
        const isFolderActive = activeRoundFolder === folder;
        const folderQuestions = getQuestionsForFolder(folder);
        const allQuestionsAnswered =
          folderQuestions.length > 0 &&
          folderQuestions.every((q) => {
            const questionKey = `${folder}-${q}`;
            return !!currentAnswers[questionKey]?.trim();
          });
        return (
          <React.Fragment key={folder}>
            <TechButton
              type="button"
              onClick={() => onSelectFolder(folder)}
              className={`cursor-pointer transition-all duration-150 text-sm mb-1 flex items-center gap-2 w-full text-left ${
                isFolderActive ? "text-white" : "hover:text-white/80"
              }`}
            >
              <Image
                src={
                  isFolderActive || allQuestionsAnswered
                    ? "/images/selected-folder.svg"
                    : "/images/unselected-folder.svg"
                }
                alt={`${folder} icon`}
                width={16}
                height={16}
              />
              {folder}
            </TechButton>
            {isFolderActive && (
              <div className="ml-6 mt-1 flex flex-col gap-1 text-[#993C7A]">
                {getQuestionsForFolder(folder).map((q) => {
                  const isQuestionActive = activeQuestion === q;
                  const questionKey = `${folder}-${q}`;
                  const isQuestionSubmitted =
                    submittedQuestions.has(questionKey);
                  const hasAnswer = !!currentAnswers[questionKey]?.trim();
                  return (
                    <TechButton
                      key={q}
                      type="button"
                      onClick={() => onSelectQuestion(q)}
                      className={`cursor-pointer transition-all duration-150 text-sm mb-1 flex items-center gap-2 w-full text-left ${
                        isQuestionActive ? "text-white" : "hover:text-white/80"
                      }`}
                    >
                      <Image
                        src={
                          isQuestionActive || isQuestionSubmitted || hasAnswer
                            ? "/images/selected-folder.svg"
                            : "/images/unselected-folder.svg"
                        }
                        alt={`${q} icon`}
                        width={12}
                        height={12}
                      />
                      {q}
                    </TechButton>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
