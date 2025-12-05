"use client";

import { Domain } from "@prisma/client";
import { Pencil, Search, Settings } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import type { QuestionPayload } from "@/lib/validation";
import { validateAnswer } from "@/lib/validation";
import createRoundUser from "../actions/create-round-user";
import fetchRoundUser from "../actions/fetch-round-user";
import saveFormResponse from "../actions/save-form-response";
import submitForm from "../actions/submit-form";
import About from "./components/management/about";
import Instructions from "./components/management/instructions";
import ManagementLanding from "./components/management/landing";
import QuestionsList from "./components/management/questions-list";
import WhatWeDo from "./components/management/whatwedo";

interface ManagementClientProps {
  initialRoundUser?: RoundUserExtended | null;
}

export default function Management({
  initialRoundUser,
}: ManagementClientProps) {
  const [activeSection, setActiveSection] = useState("Landing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [searchInput, setSearchInput] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<
    Record<string, string>
  >({});
  const [submittingForm, setSubmittingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success",
  );
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const roundHidden = !!roundUser?.round?.hidden;

  const questions = useMemo(() => {
    const qs = (roundUser?.round?.Question ||
      []) as unknown as QuestionPayload[];
    return [...qs].sort((a, b) => (a.serial ?? 0) - (b.serial ?? 0));
  }, [roundUser?.round?.Question]);

  const formId = roundUser?.formSubmission?.id;
  const roundId = roundUser?.round?.id;

  useEffect(() => {
    if (!roundUser?.formSubmission?.responses) return;

    const savedAnswers: Record<string, string> = {};
    const serverResponses = roundUser.formSubmission.responses;

    console.log(
      "[Management] Loading responses from DB:",
      serverResponses.length,
    );

    for (const response of serverResponses) {
      if (response.response && response.questionId) {
        savedAnswers[response.questionId] = response.response;
        console.log(
          `[Management] Restored answer for question ${response.questionId}:`,
          response.response.substring(0, 50),
        );
      }
    }

    console.log(
      "[Management] Total restored answers:",
      Object.keys(savedAnswers).length,
    );
    setAnswers(savedAnswers);
  }, [roundUser]);

  const initializeRoundUser = async () => {
    setLoading(true);
    setError(null);
    // console.log(await createRoundUser(Domain.cc));
    try {
      const result = await createRoundUser(Domain.management);
      console.log(result);

      if ("error" in result) {
        setError(result.error ?? "Unknown error");
        return;
      }

      setRoundUser(result.roundUser as RoundUserExtended);
      setActiveSection("About");
    } catch (err) {
      console.error("Error initializing round user:", err);

      setError(
        err instanceof Error ? err.message : "Failed to initialize round user",
      );
    } finally {
      setLoading(false);
    }
  };

  const answersByVar = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      if (q.varName) {
        map[q.varName] = answers[q.id] || "";
      }
    }
    return map;
  }, [questions, answers]);

  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout);
      Object.values(debounceTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  const autoSaveAnswer = async (qid: string, value: string) => {
    if (!formId) return;

    try {
      await saveFormResponse(formId, qid, value || null);
      console.log(`[Management] Auto-saved answer for question ${qid}`);
    } catch (e) {
      console.error(`[Management] Auto-save failed for question ${qid}:`, e);
    }
  };

  function onChangeAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    if (errors[qid]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }
    if (successMessages[qid]) {
      setSuccessMessages((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }

    if (!formId) return;

    if (debounceTimerRef.current[qid]) {
      clearTimeout(debounceTimerRef.current[qid]);
    }

    debounceTimerRef.current[qid] = setTimeout(() => {
      autoSaveAnswer(qid, value).catch((err) => {
        console.error("[Management] Debounced auto-save error:", err);
      });
    }, 3000); // 3 second debounce
  }

  async function onSubmitAnswer(q: QuestionPayload) {
    const current = answers[q.id] || "";
    const vres = validateAnswer(current, q.validators, { answersByVar });

    if (!vres.valid) {
      setErrors((prev) => ({ ...prev, [q.id]: vres.error || "Invalid value" }));
      return;
    }
    if (!formId) {
      setErrors((prev) => ({ ...prev, [q.id]: "Form not initialized" }));
      return;
    }

    try {
      await saveFormResponse(formId, q.id, current || null);
      setSuccessMessages((prev) => ({
        ...prev,
        [q.id]: "Saved successfully!",
      }));
      if (timeoutRef.current[q.id]) clearTimeout(timeoutRef.current[q.id]);
      timeoutRef.current[q.id] = setTimeout(() => {
        setSuccessMessages((prev) => {
          const next = { ...prev };
          delete next[q.id];
          return next;
        });
      }, 2000);
    } catch (e) {
      setErrors((prev) => ({ ...prev, [q.id]: "Failed to save" }));
    }
  }

  const handleSubmitForm = () => {
    // Frontend validation - check all questions are answered
    const unansweredQuestions = questions.filter((q) => !answers[q.id]?.trim());

    if (unansweredQuestions.length > 0) {
      setNotificationType("error");
      setNotification(
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`,
      );
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!roundUser?.id || !formId) {
      setNotificationType("error");
      setNotification("Form not initialized");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSubmittingForm(true);
    setShowConfirmDialog(false);

    try {
      // Build currentResponses with all question IDs
      const currentResponses = questions.reduce(
        (acc, q) => {
          acc[q.id] = answers[q.id] || "";
          return acc;
        },
        {} as Record<string, string>,
      );

      await submitForm(roundUser.id, currentResponses);

      setNotificationType("success");
      setNotification("Form submitted successfully!");

      // Refresh the round user data to get updated status
      const data = await fetchRoundUser("management");
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setRoundUser(data as RoundUserExtended);
      }

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotificationType("error");
      setNotification(
        error instanceof Error ? error.message : "Failed to submit form",
      );
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "Landing":
        return (
          <ManagementLanding
            onGetStarted={initializeRoundUser}
            wallpaper={wallpaper}
          />
        );
      case "About":
        return <About onBack={() => setActiveSection("Landing")} />;
      case "What we do":
        return <WhatWeDo onBack={() => setActiveSection("Landing")} />;
      case "Instructions":
        return <Instructions onBack={() => setActiveSection("Landing")} />;
      case "Round 1":
        if (loading) return <p className="text-white">Loading round...</p>;
        if (error) return <p className="text-red-600 font-semibold">{error}</p>;
        if (roundHidden) {
          return (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4 text-white">
                Round Hidden
              </h1>
              <p className="text-gray-300">
                This round is currently hidden and cannot be accessed.
              </p>
            </div>
          );
        }

        // Status-based rendering
        if (roundUser?.status === "evaluate") {
          return (
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col items-center justify-center p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Form Submitted Successfully!
              </h2>
              <p className="text-lg text-gray-700 text-center">
                Your responses have been submitted and are under evaluation.
                You'll be notified about the results soon.
              </p>
            </div>
          );
        }

        if (roundUser?.status === "promoted") {
          return (
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col items-center justify-center p-8">
              <h2 className="text-3xl font-bold text-green-700 mb-4">
                Congratulations! 🎉
              </h2>
              <p className="text-lg text-gray-700 text-center">
                You have been promoted to the next round!
              </p>
            </div>
          );
        }

        if (roundUser?.status === "rejected") {
          return (
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col items-center justify-center p-8">
              <h2 className="text-3xl font-bold text-red-700 mb-4">
                Thank You for Participating
              </h2>
              <p className="text-lg text-gray-700 text-center">
                Unfortunately, you haven't been selected for the next round. We
                appreciate your effort!
              </p>
            </div>
          );
        }

        return roundId && questions.length > 0 ? (
          <QuestionsList
            questions={questions}
            answers={answers}
            searchInput={searchInput}
            errors={errors}
            successMessages={successMessages}
            onChangeAnswer={onChangeAnswer}
            onSubmitAnswer={onSubmitAnswer}
            wallpaper={wallpaper}
            onSubmitForm={handleSubmitForm}
            roundUser={roundUser}
            submittingForm={submittingForm}
            onBack={() => setActiveSection("Landing")}
          />
        ) : (
          <p className="text-gray-700">No questions available.</p>
        );
      default:
        return null;
    }
  };

  const [settings, setSettings] = useState(false);
  const [wallpaper, setWallpaper] = useState("big sur");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("selectedWallpaper");
    if (saved) setWallpaper(saved);
  }, []);

  const handleWallpaperChange = (wall: string) => {
    setFade(true);
    setTimeout(() => {
      setWallpaper(wall);
      localStorage.setItem("selectedWallpaper", wall);
      setFade(false);
    }, 300);
  };

  return (
    <div className="h-full flex w-full overflow-hidden font-helvetica">
      {notification && (
        <div
          className={`fixed top-8 right-8 px-6 py-3 font-medium shadow-lg z-50 text-white border rounded-lg ${
            notificationType === "success"
              ? "bg-green-600 border-green-500"
              : "bg-red-600 border-red-500"
          }`}
        >
          {notification}
        </div>
      )}
      {showConfirmDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-[2000]">
          <div className="bg-white border-2 border-gray-300 p-8 rounded-2xl max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-gray-800 text-2xl font-bold mb-4">
              Confirm Submission
            </h3>
            <p className="text-gray-700 text-lg mb-6">
              You won't be able to edit your responses after this. Are you sure
              you want to submit?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelSubmit}
                className="px-6 py-2 bg-transparent border-2 border-gray-400 text-gray-700 hover:bg-gray-100 transition-colors rounded-lg font-medium"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium"
                type="button"
                disabled={submittingForm}
              >
                {submittingForm ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Image
        src={`/images/management/wallpapers/${wallpaper}.svg`}
        width={1920}
        height={1080}
        alt="bg"
        className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-500 ${
          fade ? "opacity-60" : "opacity-100"
        }`}
      />

      <div
        className={`absolute top-0 left-0 w-full h-full bg-black/60 transition-opacity duration-500 pointer-events-none ${
          fade ? "opacity-100 backdrop-blur-lg" : "opacity-0"
        }`}
      />

      <aside className="flex flex-col h-full w-[20vw] py-8 px-4 text-white z-10 font-helvetica">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={180}
          height={180}
          className="mb-8"
        />
        <div className="flex mb-5 items-center w-[80%] h-12 gap-2 bg-[#ececec] text-[#6b5f5f] px-4 py-2 rounded-xl drop-shadow-md/20">
          <Pencil /> <span className="font-medium">Compose</span>
        </div>
        <nav className="flex flex-col space-y-2 text-lg">
          {(() => {
            const allSections = [
              "About",
              "What we do",
              "Instructions",
              "Round 1",
            ];
            // When NOT on Round 1, let searchInput filter the left navbar components
            const filteredSections =
              activeSection === "Round 1" || !searchInput.trim()
                ? allSections
                : allSections.filter((s) =>
                    s.toLowerCase().includes(searchInput.trim().toLowerCase()),
                  );

            return filteredSections.map((section) => {
              const isDisabled = !roundUser && section !== "Landing";
              return (
                <button
                  type="button"
                  key={section}
                  onClick={() => !isDisabled && setActiveSection(section)}
                  disabled={isDisabled}
                  className={`rounded-4xl px-6 py-2 text-left font-medium transition ${
                    activeSection === section
                      ? "bg-[#ececec] text-[#6b5f5f] drop-shadow-lg/"
                      : isDisabled
                        ? "text-gray-500 cursor-not-allowed opacity-50"
                        : "hover:text-gray-200 hover:bg-white/25 text-white"
                  }`}
                >
                  {section}
                </button>
              );
            });
          })()}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-8">
        <div className="flex w-full justify-center items-center relative mt-5">
          {/* Search bar */}
          <div className="px-5 py-2 gap-2 flex flex-row bg-white/60 backdrop-blur-xl w-[90%] justify-center items-center rounded-full shadow-md">
            <Search className="text-black" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (activeSection !== "Round 1") {
                    const allSections = [
                      "About",
                      "What we do",
                      "Instructions",
                      "Round 1",
                    ];
                    const matches = !searchInput.trim()
                      ? allSections
                      : allSections.filter((s) =>
                          s
                            .toLowerCase()
                            .includes(searchInput.trim().toLowerCase()),
                        );
                    if (matches.length > 0) {
                      setActiveSection(matches[0]);
                    }
                  }
                }
              }}
              placeholder="Search Mail"
              className="outline-none flex-1 text-black placeholder-gray-600 bg-transparent"
            />
          </div>

          {/* Settings Dropdown */}
          <div className="ml-4 relative">
            <button
              type="button"
              onClick={() => setSettings(!settings)}
              className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              <Settings className="text-black" />
            </button>

            {settings && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-3 w-48 flex flex-col gap-2 z-100 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg p-3 animate-[fadeIn_0.2s_ease-out]"
              >
                {["sonoma", "sequoia", "big sur"].map((wall, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWallpaperChange(wall);
                      setSettings(false);
                    }}
                    className="cursor-pointer flex items-center justify-center"
                  >
                    <div className="group relative flex items-center justify-center">
                      <Image
                        src={`/images/management/wallpapers/${wall}.svg`}
                        width={500}
                        height={500}
                        alt={wall}
                        className="rounded-lg transition-all duration-300 group-hover:brightness-50"
                      />
                      <span className="absolute text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {wall}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-[90%] w-full flex items-center justify-center">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}
