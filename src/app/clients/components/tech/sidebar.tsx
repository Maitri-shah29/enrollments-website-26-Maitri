"use client";
import Image from "next/image";
import React, { useState } from "react";
import submitForm from "@/app/actions/submit-form";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { DOMAIN_CAP } from "@/lib/constants";
import type { AOI, QuestionId, Section } from "@/lib/types";
import AoiList from "./aoi-list";
import NavItem from "./nav-item";
import Round1List from "./round1-list";

type Props = {
  activeSection: Section;
  onChangeSection: (s: Section) => void;
  aoiExpanded: boolean;
  onToggleAoi: () => void;
  roundExpanded: boolean;
  onToggleRound: () => void;
  activeAOI: AOI;
  onSelectAOI: (aoi: AOI) => void;
  activeRoundFolder: string | "";
  activeQuestion: QuestionId | "";
  onSelectFolder: (folder: string) => void;
  onSelectQuestion: (q: QuestionId) => void;
  submittedQuestions: Set<string>;
  onLogoClick: () => void;
  roundUser?: RoundUserExtended | null;
  joinedAOIs: Set<AOI>;
  currentAnswers: Record<string, string>;
  savedAnswers?: Record<string, string>;
  roundActive?: boolean;
  roundHidden?: boolean;
  roundUserCount?: number;
};

export default function Sidebar({
  activeSection,
  onChangeSection,
  aoiExpanded,
  onToggleAoi,
  roundExpanded,
  onToggleRound,
  activeAOI,
  onSelectAOI,
  activeRoundFolder,
  activeQuestion,
  onSelectFolder,
  onSelectQuestion,
  submittedQuestions,
  onLogoClick,
  roundUser,
  joinedAOIs,
  currentAnswers,
  savedAnswers = {},
  roundActive = true,
  roundHidden = false,
  roundUserCount = 0,
}: Props) {
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [submittingForm, setSubmittingForm] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success"
  );

  const isLimitReached =
    roundUserCount >= DOMAIN_CAP && roundUser?.status === "pending";

  const handleSubmitForm = () => {
    const joinedAOIsArray = Array.from(joinedAOIs);
    const allQuestions = roundUser?.round?.Question || [];
    const relevantQuestions = allQuestions.filter(
      (q: (typeof allQuestions)[number]) => {
        const isStandard = q.type === "stq" || q.type === "ltq";
        const isAOI = q.varName && joinedAOIsArray.includes(q.varName as AOI);
        const isCommon = !q.varName || q.varName === "common";
        return isStandard && (isAOI || isCommon);
      }
    );

    // Check if all questions are saved
    const unsavedQuestions = relevantQuestions.filter(
      (question: (typeof allQuestions)[number]) => {
        const folderQuestions = allQuestions
          .filter(
            (q: (typeof allQuestions)[number]) => q.varName === question.varName
          )
          .sort(
            (
              a: (typeof allQuestions)[number],
              b: (typeof allQuestions)[number]
            ) => a.serial - b.serial
          );
        const questionIndex = folderQuestions.findIndex(
          (q: (typeof allQuestions)[number]) => q.id === question.id
        );
        console.log(savedAnswers, currentAnswers);
        if (questionIndex !== -1) {
          const folderKey = question.varName || "common";
          const questionKey = `${folderKey}-question${questionIndex + 1}`;
          const currentAnswer = currentAnswers[questionKey] || "";
          const savedAnswer = savedAnswers[question.id];
          // Question is unsaved if: no saved answer exists OR current answer differs from saved
          // console.log(currentAnswer, savedAnswer);
          // console.log("hdnsjhdl")
          return savedAnswer === undefined || currentAnswer !== savedAnswer;
        }
        return false;
      }
    );

    if (unsavedQuestions.length > 0) {
      console.log(unsavedQuestions);
      setNotificationType("error");
      setNotification(
        `Please save all answers before submitting. ${unsavedQuestions.length} question(s) have unsaved changes.`
      );
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!roundUser?.id) {
      setNotificationType("error");
      setNotification("No round user found");
      setShowConfirmDialog(false);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Get all question IDs for joined AOIs only
    const joinedAOIsArray = Array.from(joinedAOIs);
    const allQuestions = roundUser.round?.Question || [];
    const relevantQuestions = allQuestions.filter(
      (q: (typeof allQuestions)[number]) => {
        const isStandard = q.type === "stq" || q.type === "ltq";
        const isAOI = q.varName && joinedAOIsArray.includes(q.varName as AOI);
        const isCommon = !q.varName || q.varName === "common";
        return isStandard && (isAOI || isCommon);
      }
    );

    // Build effective responses only for joined AOIs
    const effectiveResponses: Record<string, string> = {};
    for (const question of relevantQuestions) {
      const folderQuestions = allQuestions
        .filter(
          (q: (typeof allQuestions)[number]) => q.varName === question.varName
        )
        .sort(
          (
            a: (typeof allQuestions)[number],
            b: (typeof allQuestions)[number]
          ) => a.serial - b.serial
        );
      const questionIndex = folderQuestions.findIndex(
        (q: (typeof allQuestions)[number]) => q.id === question.id
      );
      if (questionIndex !== -1) {
        const folderKey = question.varName || "common";
        const questionKey = `${folderKey}-question${questionIndex + 1}`;
        effectiveResponses[question.id] = currentAnswers[questionKey] || "";
      }
    }

    setSubmittingForm(true);
    setShowConfirmDialog(false);
    setNotification(null);

    try {
      const result = await submitForm(roundUser.id, effectiveResponses);
      if (result.error) {
        setNotificationType("error");
        setNotification(result.error);
      } else {
        setNotificationType("success");
        setNotification(
          "Form submitted successfully! Your responses are now being evaluated."
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error("Submit form error:", err);
      setNotificationType("error");
      setNotification("Failed to submit form");
    } finally {
      setSubmittingForm(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const roundUserStatus = roundUser?.status || "pending";
  return (
    <div className="min-w-45 w-[16%] overflow-hidden border-r-2 border-[#993C7A] h-full p-2 overflow-y-auto font-jetbrains [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#08111D] [&::-webkit-scrollbar-thumb]:bg-[#993C7A] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-[#08111D] [&::-webkit-scrollbar-thumb:hover]:bg-[#b84a92]">
      {notification && (
        <div
          className={`fixed top-30 right-8 px-4 py-2 font-jetbrains shadow-lg z-50 text-white border ${
            notificationType === "success"
              ? "bg-[#08111D] border-[#993C7A]"
              : "bg-[#08111D] border-red-500"
          }`}
        >
          {notification}
        </div>
      )}
      {showConfirmDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#08111D] border-2 border-[#993C7A] p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-[#993C7A] text-2xl font-jetbrains mb-4">
              Confirm Submission
            </h3>
            <p className="text-white text-lg mb-6 font-jetbrains">
              You won't be able to edit your responses after this. Are you sure
              you want to submit?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelSubmit}
                className="px-6 py-2 bg-transparent border-2 border-white text-white font-jetbrains hover:bg-white hover:text-black transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-[#993C7A] text-white font-jetbrains hover:bg-[#b84a92] transition-colors"
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-center items-center mb-4 mt-4">
        <Image
          src="/images/acmlogo.svg"
          alt="acm logo"
          width={150}
          height={90}
          className="hover:cursor-pointer"
          onClick={onLogoClick}
        />
      </div>
      <div className="w-full h-fit mt-5 font-jetbrains">
        {(
          [
            { name: "About", key: "about" },
            { name: "Instructions", key: "instructions" },
            { name: "AOI", key: "aoi" },
            { name: "Explore", key: "explore" },
            { name: "Round 1", key: "round1" },
          ] as const
        )
          .filter(
            (item) =>
              !(roundHidden && item.name.toLowerCase().startsWith("round"))
          )
          .map((item) => (
            <React.Fragment key={item.key}>
              <NavItem
                label={item.name}
                iconSrc="/images/folder.svg"
                isActive={activeSection === item.key}
                hasBottomBorder={item.key === "round1"}
                disabled={!roundUser || isLimitReached}
                onClick={() => {
                  if (item.key === "aoi") {
                    // If AOI is already active, toggle it; otherwise, set it as active and ensure it's expanded
                    if (activeSection === "aoi") {
                      onToggleAoi();
                    } else {
                      onChangeSection("aoi");
                      // Ensure it's expanded when switching to AOI section
                      if (!aoiExpanded) {
                        onToggleAoi();
                      }
                    }
                    return;
                  }
                  if (item.key === "round1") {
                    onChangeSection("round1");
                    if (roundActive) {
                      onToggleRound();
                    }
                    return;
                  }
                  onChangeSection(item.key);
                }}
              />
              {item.key === "aoi" && activeSection === "aoi" && aoiExpanded && (
                <AoiList activeAOI={activeAOI} onSelectAOI={onSelectAOI} />
              )}
              {item.key === "round1" &&
                activeSection === "round1" &&
                roundExpanded &&
                roundActive && (
                  <Round1List
                    activeRoundFolder={activeRoundFolder}
                    activeQuestion={activeQuestion}
                    onSelectFolder={onSelectFolder}
                    onSelectQuestion={onSelectQuestion}
                    submittedQuestions={submittedQuestions}
                    roundUser={roundUser}
                    joinedAOIs={joinedAOIs}
                    currentAnswers={currentAnswers}
                    savedAnswers={savedAnswers}
                  />
                )}
            </React.Fragment>
          ))}
      </div>
      {roundUser && roundUserStatus === "pending" && (
        <div className="mt-6 px-2">
          <button
            onClick={handleSubmitForm}
            disabled={submittingForm}
            className="w-full bg-transparent border-2 border-[#993C7A] text-[#993C7A] hover:bg-[#993C7A] hover:text-white px-4 py-2 font-jetbrains text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {submittingForm ? "Submitting..." : "Submit Form"}
          </button>
        </div>
      )}
    </div>
  );
}
