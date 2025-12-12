"use client";

import { Pencil, Search, Settings } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import { DOMAIN_CAP } from "@/lib/constants";
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
  roundUserCount: number;
}

export default function Management({
  initialRoundUser,
  roundUserCount,
}: ManagementClientProps) {
  const [activeSection, setActiveSection] = useState("Landing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null
  );
  const [searchInput, setSearchInput] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessages, setSuccessMessages] = useState<
    Record<string, string>
  >({});
  const [submittingForm, setSubmittingForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingQuestionIndex, setPendingQuestionIndex] = useState<
    number | null
  >(null);
  const [pendingBackNavigation, setPendingBackNavigation] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success"
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const roundActive = !!roundUser?.round?.active;
  const _roundHidden = !!roundUser?.round?.hidden;
  const [isProceeding, setIsProceeding] = useState<boolean>(false);

  const questions = useMemo(() => {
    const qs = (roundUser?.round?.Question ||
      []) as unknown as QuestionPayload[];
    return [...qs].sort((a, b) => (a.serial ?? 0) - (b.serial ?? 0));
  }, [roundUser?.round?.Question]);

  const formId = roundUser?.formSubmission?.id;
  const roundId = roundUser?.round?.id;

  useEffect(() => {
    if (!roundUser?.formSubmission?.responses) return;

    const loadedAnswers: Record<string, string> = {};
    const loadedSavedAnswers: Record<string, string> = {};
    const serverResponses = roundUser.formSubmission.responses;

    console.log(
      "[Management] Loading responses from DB:",
      serverResponses.length
    );

    for (const response of serverResponses) {
      if (response.response && response.questionId) {
        loadedAnswers[response.questionId] = response.response;
        loadedSavedAnswers[response.questionId] = response.response;
        console.log(
          `[Management] Restored answer for question ${response.questionId}:`,
          response.response.substring(0, 50)
        );
      }
    }

    console.log(
      "[Management] Total restored answers:",
      Object.keys(loadedAnswers).length
    );
    setAnswers(loadedAnswers);
    setSavedAnswers(loadedSavedAnswers);
  }, [roundUser]);

  const initializeRoundUser = async () => {
    setLoading(true);
    setError(null);
    // console.log(await createRoundUser(Domain.cc));
    if (roundUserCount >= DOMAIN_CAP) {
      setError(
        `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`
      );
      setLoading(false);
      return;
    }
    try {
      const result = await createRoundUser("management");
      console.log(result);

      if ("error" in result) {
        if (result.error === "Round is not active") {
          setError("Enrollments for this domain haven't started yet");
        } else if (result.error === "No form round found for this domain") {
          setError("This domain is not available for enrollment at the moment");
        } else if (result.error === "Internal server error") {
          setError("Something went wrong. Please try again later");
        } else {
          setError(result.error ?? "Unknown error");
        }
        return;
      }

      setRoundUser(result.roundUser as RoundUserExtended);
      setActiveSection("About");
    } catch (err) {
      console.error("Error initializing round user:", err);

      setError(
        err instanceof Error ? err.message : "Failed to initialize round user"
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
    };
  }, []);

  function onChangeAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));

    // If the question was previously saved and the value differs, mark it as unsaved
    if (savedAnswers[qid] !== undefined && savedAnswers[qid] !== value) {
      setSavedAnswers((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }

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
      setSavedAnswers((prev) => ({ ...prev, [q.id]: current }));
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
    } catch (_e) {
      setErrors((prev) => ({ ...prev, [q.id]: "Failed to save" }));
    }
  }

  const handleSubmitForm = () => {
    const unansweredQuestions = questions.filter((q) => !answers[q.id]?.trim());

    if (unansweredQuestions.length > 0) {
      setNotificationType("error");
      setNotification(
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`
      );
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    // Check if all questions are saved
    const unsavedQuestions = questions.filter((q) => {
      const currentAnswer = answers[q.id] || "";
      const savedAnswer = savedAnswers[q.id];
      return savedAnswer === undefined || currentAnswer !== savedAnswer;
    });

    if (unsavedQuestions.length > 0) {
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
      const currentResponses = questions.reduce((acc, q) => {
        acc[q.id] = answers[q.id] || "";
        return acc;
      }, {} as Record<string, string>);

      const result = await submitForm(roundUser.id, currentResponses);

      if (result.error) {
        throw new Error(result.error);
      }

      setNotificationType("success");
      setNotification("Form submitted successfully!");

      const data = await fetchRoundUser("management");
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setRoundUser(data as RoundUserExtended);
      }

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotificationType("error");
      setNotification(
        error instanceof Error ? error.message : "Failed to submit form"
      );
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  // const handleQuestionClick = (index: number): boolean => {
  //   const questionId = questions[index]?.id;
  //   if (!questionId) return true;

  //   const currentAnswer = answers[questionId] || "";
  //   const savedAnswer = savedAnswers[questionId] || "";
  //   const hasUnsavedChanges = currentAnswer !== savedAnswer;

  //   if (hasUnsavedChanges) {
  //     setPendingQuestionIndex(index);
  //     setPendingBackNavigation(false);
  //     setShowUnsavedDialog(true);
  //     return false;
  //   }
  //   return true;
  // };

  const handleBackClick = (): void => {
    if (activeIndex !== null) {
      const questionId = questions[activeIndex]?.id;
      if (questionId) {
        const currentAnswer = answers[questionId] || "";
        const savedAnswer = savedAnswers[questionId] || "";
        const hasUnsavedChanges = currentAnswer !== savedAnswer;

        if (hasUnsavedChanges) {
          setPendingBackNavigation(true);
          setPendingQuestionIndex(null);
          setShowUnsavedDialog(true);
        } else {
          setActiveIndex(null);
        }
      }
    }
  };
  const isAnnounced = !!roundUser?.round?.announced;
  const renderActiveSection = () => {
    switch (activeSection) {
      case "Landing":
        return (
          <ManagementLanding
            onGetStarted={initializeRoundUser}
            wallpaper={wallpaper}
            loading={loading}
            hasRoundUser={!!roundUser}
            onContinue={() => setActiveSection("About")}
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
        if (!roundActive) {
          return (
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col items-center justify-center p-8">
              <h1 className="text-3xl font-bold mb-4 text-gray-800">
                Round currently inactive.
              </h1>
              <p className="text-lg text-gray-700">
                This round will start soon...
              </p>
            </div>
          );
        }

        // Status-based rendering
        if (roundUser?.status === "evaluate" || !isAnnounced) {
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

        if (roundUser?.status === "promoted" && isAnnounced) {
          return (
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-full h-[90%] shadow-lg flex flex-col items-center justify-center p-8">
              <h2 className="text-3xl font-bold text-green-700 mb-4">
                Congratulations! 🎉
              </h2>
              <p className="text-lg text-gray-700 text-center">
                You have been promoted to the next round!
              </p>
            </div>
          );
        }

        if (roundUser?.status === "rejected" && isAnnounced) {
          return (
            <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-full h-[90%] shadow-lg flex flex-col items-center justify-center p-8">
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
            savedAnswers={savedAnswers}
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
            onQuestionBackClick={handleBackClick}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
        ) : (
          <p className="text-gray-700">No questions available.</p>
        );
      default:
        return null;
    }
  };

  const [settings, setSettings] = useState(false);
  const [wallpaper, setWallpaper] = useState("sequoia");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("selectedWallpaper");
    if (saved) setWallpaper(saved);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settings) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-settings-menu]")) {
          setSettings(false);
        }
      }
    };

    if (settings) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settings]);

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
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-red-400 rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-red-500 text-2xl font-bold mb-4">Oops!</h3>
            <p className="text-gray-700 text-lg mb-6">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-full px-6 py-2 bg-red-500 text-white font-medium rounded-2xl hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
      {showUnsavedDialog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-2000">
          <div className="bg-white border-2 border-gray-300 p-8 rounded-2xl max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-gray-800 text-2xl font-bold mb-4">
              Unsaved Changes
            </h3>
            <p className="text-gray-700 text-lg mb-6">
              You have unsaved changes. Do you want to proceed without saving?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowUnsavedDialog(false);
                  setPendingQuestionIndex(null);
                  setPendingBackNavigation(false);
                }}
                className="px-6 py-2 bg-transparent border-2 border-gray-400 text-gray-700 hover:bg-gray-100 transition-colors rounded-lg font-medium"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeIndex != null) {
                    setIsProceeding(true);
                    onSubmitAnswer(questions[activeIndex]).then(() => {
                      setIsProceeding(false);
                      setShowUnsavedDialog(false);
                      if (pendingBackNavigation) {
                        setActiveIndex(null);
                        setPendingBackNavigation(false);
                      } else if (pendingQuestionIndex !== null) {
                        // Proceed with navigation - this will be handled in QuestionsList
                        const event = new CustomEvent("proceedWithNavigation", {
                          detail: { index: pendingQuestionIndex },
                        });
                        window.dispatchEvent(event);
                        setPendingQuestionIndex(null);
                      }
                    });
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg font-medium"
                type="button"
                disabled={isProceeding}
              >
                {isProceeding ? "Saving..." : "Proceed & Save"}
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
        draggable={false}
        className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-500 select-none ${
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
          draggable={false}
          className="mb-8 select-none"
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

            const isLimitReached =
              roundUserCount >= DOMAIN_CAP && roundUser?.status === "pending";

            return allSections.map((section) => {
              const isDisabled =
                (!roundUser && section !== "Landing") || isLimitReached;
              // if (section === "Round 1") {
              //   return <div key="round 1"></div>;
              // }
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
                      ? "text-gray-900 cursor-not-allowed opacity-50"
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
              placeholder="Search Questions"
              className="outline-none flex-1 text-black placeholder-gray-600 bg-transparent"
            />
          </div>

          {/* Settings Dropdown */}
          <div className="ml-4 relative" data-settings-menu>
            <button
              type="button"
              onClick={() => setSettings(!settings)}
              className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              <Settings className="text-black" />
            </button>

            {settings && (
              <div
                role="menu"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.key === "Escape" && e.stopPropagation()}
                className="absolute right-0 mt-3 w-48 flex flex-col gap-2 z-100 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg p-3 animate-[fadeIn_0.2s_ease-out]"
              >
                {["sequoia", "sonoma", "big sur"].map((wall) => (
                  <button
                    key={wall}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWallpaperChange(wall);
                      setSettings(false);
                    }}
                    className="cursor-pointer flex items-center justify-center bg-transparent border-none p-0"
                  >
                    <div className="group relative flex items-center justify-center">
                      <Image
                        src={`/images/management/wallpapers/thumbnails/${wall}.webp`}
                        width={200}
                        height={125}
                        alt={wall}
                        className="rounded-lg transition-all duration-300 group-hover:brightness-50"
                      />
                      <span className="absolute text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {wall}
                      </span>
                    </div>
                  </button>
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
