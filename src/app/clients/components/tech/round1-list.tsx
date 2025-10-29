"use client";
import Image from "next/image";
import React from "react";
import { questionsList, round1Folders } from "@/lib/constants";
import type { AOI, QuestionId } from "@/lib/types";
import TechButton from "./button";

type Props = {
  activeRoundFolder: AOI | "";
  activeQuestion: QuestionId | "";
  onSelectFolder: (folder: AOI) => void;
  onSelectQuestion: (q: QuestionId) => void;
  submittedQuestions: Set<string>;
};

export default function Round1List({
  activeRoundFolder,
  activeQuestion,
  onSelectFolder,
  onSelectQuestion,
  submittedQuestions,
}: Props) {
  return (
    <div className="ml-4 mt-2 flex flex-col gap-1 text-[#993C7A] text-sm">
      {round1Folders.map((folder) => {
        const isFolderActive = activeRoundFolder === folder;
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
                  isFolderActive
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
                {questionsList.map((q) => {
                  const isQuestionActive = activeQuestion === q;
                  const questionKey = `${folder}-${q}`;
                  const isQuestionSubmitted =
                    submittedQuestions.has(questionKey);
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
                          isQuestionActive || isQuestionSubmitted
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
