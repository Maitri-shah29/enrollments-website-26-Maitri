"use client";
import type {
  Domain,
  Round,
  RoundUser,
  Task,
  TaskSubmission,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import fetchTaskRoundUsers from "@/app/actions/fetch-task-user";
import submitTask from "@/app/actions/submit-task";

type RoundUserWithRelations = RoundUser & {
  round: Round;
  Task: Task | null;
  TaskSubmission: TaskSubmission | null;
};

type TaskClientProps = {
  initialRoundUsers: RoundUserWithRelations[];
};

const FormattedText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  // Split by newlines first to preserve line breaks
  const lines = text.split(/\n/);

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => {
        // Split each line by URLs
        const parts = line.split(/(https?:\/\/[^\s]+)/g);

        return (
          <p key={`line-${lineIndex}`} className={lineIndex > 0 ? "mt-2" : ""}>
            {line === "" ? (
              <br />
            ) : (
              parts.map((part, partIndex) => {
                if (part.match(/^(https?:\/\/[^\s]+)$/)) {
                  return (
                    <a
                      key={`${lineIndex}-${partIndex}`}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
                    >
                      {part}
                    </a>
                  );
                }
                // Handle dash-prefixed lines as list items
                if (partIndex === 0 && part.trim().startsWith("-")) {
                  return (
                    <span key={`${lineIndex}-${partIndex}`} className="block pl-4">
                      <span className="text-blue-400 mr-2">•</span>
                      {part.trim().slice(1).trim()}
                    </span>
                  );
                }
                return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
              })
            )}
          </p>
        );
      })}
    </div>
  );
};

const TaskClient = ({ initialRoundUsers }: TaskClientProps) => {
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [allRoundUsers, setAllRoundUsers] =
    useState<RoundUserWithRelations[]>(initialRoundUsers);
  const [submissionText, setSubmissionText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    [],
  );

  const getNotificationClasses = (type: "success" | "error") => {
    return type === "success"
      ? "bg-green-800 border-green-900"
      : "bg-red-800 border-red-900";
  };

  const availableDomains = useMemo(() => {
    return allRoundUsers.map((ru) => {
      if (ru.round.domain === "cc") return "Competitive Coding";
      return ru.round.domain.charAt(0).toUpperCase() + ru.round.domain.slice(1);
    });
  }, [allRoundUsers]);

  useEffect(() => {
    if (availableDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(availableDomains[0]);
    } else if (
      availableDomains.length > 0 &&
      !availableDomains.includes(selectedDomain)
    ) {
      setSelectedDomain(availableDomains[0]);
    }
  }, [availableDomains, selectedDomain]);

  const selectedRoundUser = useMemo(() => {
    if (!selectedDomain) return null;
    let domainEnum: Domain;
    const normalizedDomain = selectedDomain.toLowerCase();

    if (normalizedDomain === "competitive coding") {
      domainEnum = "cc" as Domain;
    } else {
      domainEnum = normalizedDomain as Domain;
    }
    return allRoundUsers.find((ru) => ru.round.domain === domainEnum);
  }, [selectedDomain, allRoundUsers]);

  useEffect(() => {
    if (selectedRoundUser?.TaskSubmission) {
      setSubmissionText(selectedRoundUser.TaskSubmission.text);
    } else {
      setSubmissionText("");
    }
  }, [selectedRoundUser]);

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await executeSubmit();
  };

  const executeSubmit = async () => {
    if (!selectedRoundUser || !submissionText.trim()) return;

    setSubmitting(true);

    try {
      await submitTask(selectedRoundUser.id, submissionText);

      // Refresh data
      const refreshResult = await fetchTaskRoundUsers();
      if (
        refreshResult &&
        "roundusers" in refreshResult &&
        refreshResult.roundusers
      ) {
        setAllRoundUsers(refreshResult.roundusers);
      }

      showNotification("Task submitted successfully!", "success");
    } catch (error) {
      console.error("Error submitting task:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to submit task",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (!selectedRoundUser || !submissionText.trim()) {
      showNotification("Please enter your submission", "error");
      return;
    }
    setShowConfirmModal(true);
  };

  const formatDeadline = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(d);
  };

  const isDeadlinePassed = useCallback((deadline: Date) => {
    return new Date(deadline) < new Date();
  }, []);

  const isReadOnly = useMemo(() => {
    if (!selectedRoundUser) return true;
    if (selectedRoundUser.status === "evaluate") return true;
    if (
      selectedRoundUser.Task &&
      isDeadlinePassed(selectedRoundUser.Task.deadline)
    )
      return true;
    return false;
  }, [selectedRoundUser, isDeadlinePassed]);

  // Calculate time remaining until deadline
  const getTimeRemaining = useCallback((deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, []);

  // Close mobile menu when domain is selected
  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setMobileMenuOpen(false);
  };

  if (allRoundUsers.length === 0) {
    return (
      <div className="flex min-h-screen bg-black text-white font-[var(--font-poppins)] items-center justify-center">
        <div className="flex flex-col items-center max-w-md text-center p-8">
          <h1
            className="text-2xl font-medium mb-4"
            style={{ fontFamily: "PoppinsBlack" }}
          >
            Task Submissions
          </h1>
          <p
            className="text-gray-400 mb-8"
            style={{ fontFamily: "PoppinsReg" }}
          >
            You don't have any tasks assigned at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans relative">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 md:top-8 md:right-10 z-50 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-2 duration-300 ${getNotificationClasses(
            notification.type,
          )}`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span style={{ fontFamily: "PoppinsReg" }}>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl md:text-2xl font-bold mb-4 text-white" style={{ fontFamily: "PoppinsBlack" }}>
              Confirm Submission
            </h3>
            <p className="text-gray-300 mb-6 md:mb-8 text-base md:text-lg leading-relaxed" style={{ fontFamily: "PoppinsReg" }}>
              Are you sure you want to submit? <br />
              <span className="text-red-400 font-medium">
                You will NOT be able to change your answer after this.
              </span>
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-zinc-800 transition-colors font-medium border border-zinc-700"
                style={{ fontFamily: "PoppinsReg" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/20"
                style={{ fontFamily: "PoppinsReg" }}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "PoppinsBlack" }}
          >
            Tasks
          </h2>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Domain Selector */}
        {mobileMenuOpen && (
          <nav className="mt-3 pb-2 space-y-1 border-t border-zinc-800 pt-3">
            {availableDomains.map((domain) => (
              <button
                type="button"
                key={domain}
                onClick={() => handleDomainSelect(domain)}
                style={{ fontFamily: "PoppinsReg" }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedDomain === domain
                    ? "bg-zinc-800 text-white"
                    : "text-gray-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                {domain}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-zinc-900 border-r border-zinc-800 p-6 shrink-0">
        <h2
          className="text-xl font-semibold mb-6"
          style={{ fontFamily: "PoppinsBlack" }}
        >
          Tasks
        </h2>
        <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "PoppinsReg" }}>
          Select a domain
        </p>
        <nav className="space-y-2">
          {availableDomains.map((domain) => (
            <button
              type="button"
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              style={{ fontFamily: "PoppinsReg" }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                selectedDomain === domain
                  ? "bg-zinc-800 text-white shadow-md"
                  : "text-gray-400 hover:bg-zinc-800/50 hover:text-white hover:translate-x-1"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{domain}</span>
                {selectedDomain === domain && (
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-auto">
        {selectedRoundUser ? (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ fontFamily: "PoppinsBlack" }}
              >
                {selectedDomain} Task
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm">
                <span
                  className="px-3 py-1 bg-zinc-800 rounded-full text-gray-300"
                  style={{ fontFamily: "PoppinsReg" }}
                >
                  Round {selectedRoundUser.round.number}
                </span>
                {selectedRoundUser.Task && (
                  <>
                    <span
                      style={{ fontFamily: "PoppinsReg" }}
                      className={`px-3 py-1 rounded-full ${
                        isDeadlinePassed(selectedRoundUser.Task.deadline)
                          ? "bg-red-900/30 text-red-400 border border-red-800"
                          : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                      }`}
                    >
                      {formatDeadline(selectedRoundUser.Task.deadline)}
                    </span>
                    {!isDeadlinePassed(selectedRoundUser.Task.deadline) && (
                      <span
                        className="text-green-400 text-xs md:text-sm animate-pulse"
                        style={{ fontFamily: "PoppinsReg" }}
                      >
                        ⏱ {getTimeRemaining(selectedRoundUser.Task.deadline)}
                      </span>
                    )}
                  </>
                )}
                {selectedRoundUser.status === "evaluate" && (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-medium">
                    Under Evaluation
                  </span>
                )}
              </div>
            </div>

            {selectedRoundUser.status === "promoted" ? (
              <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-gradient-to-br from-green-900/20 to-zinc-900/50 rounded-xl border border-green-900/50">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                    aria-label="Success"
                  >
                    <title>Success</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: "PoppinsBlack" }}>
                  Congratulations!
                </h2>
                <p className="text-gray-300 max-w-md" style={{ fontFamily: "PoppinsReg" }}>
                  You have been promoted to the next round. Keep up the great
                  work!
                </p>
              </div>
            ) : selectedRoundUser.status === "rejected" ? (
              <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                    aria-label="Not selected"
                  >
                    <title>Not selected</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-400 mb-2" style={{ fontFamily: "PoppinsBlack" }}>
                  Better Luck Next Time
                </h2>
                <p className="text-gray-500 max-w-md" style={{ fontFamily: "PoppinsReg" }}>
                  Unfortunately, you have not been selected for the next round.
                  We appreciate your participation and effort.
                </p>
              </div>
            ) : (
              <>
                {/* Task Description */}
                {selectedRoundUser.Task && (
                  <div className="mb-6 md:mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h2
                        className="text-lg md:text-xl font-semibold flex items-center gap-2"
                        style={{ fontFamily: "PoppinsBlack" }}
                      >
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Task Description
                      </h2>
                    </div>
                    <FormattedText
                      text={selectedRoundUser.Task.text}
                      className="text-gray-300 leading-relaxed bg-zinc-900 rounded-xl border border-zinc-800 min-h-[3rem] p-4 md:p-6 text-sm md:text-base"
                    />
                  </div>
                )}

                {/* Submission Section */}
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                    <h2
                      className="text-lg md:text-xl font-semibold flex items-center gap-2"
                      style={{ fontFamily: "PoppinsBlack" }}
                    >
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Your Submission
                    </h2>
                    {selectedRoundUser.TaskSubmission && (
                      <span
                        className="text-xs md:text-sm text-gray-400 flex items-center gap-1"
                        style={{ fontFamily: "PoppinsReg" }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last submitted:{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(
                          new Date(
                            selectedRoundUser.TaskSubmission.submittedAt,
                          ),
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      style={{ fontFamily: "PoppinsReg" }}
                      placeholder="Enter your submission here..."
                      className="w-full h-48 md:h-64 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                      disabled={submitting || isReadOnly}
                    />
                    {/* Character count */}
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500" style={{ fontFamily: "PoppinsReg" }}>
                      {submissionText.length} characters
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {selectedRoundUser.status !== "evaluate" && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      type="button"
                      style={{ fontFamily: "PoppinsReg" }}
                      onClick={handleSubmitClick}
                      disabled={
                        submitting || !submissionText.trim() || isReadOnly
                      }
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-medium transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Submit Task
                        </>
                      )}
                    </button>
                    {!isReadOnly && submissionText.trim() && (
                      <span className="text-xs text-gray-500" style={{ fontFamily: "PoppinsReg" }}>
                        You can resubmit until the deadline
                      </span>
                    )}
                  </div>
                )}

                {isReadOnly && (
                  <div
                    className="mt-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-400 text-sm flex items-center gap-3"
                    style={{ fontFamily: "PoppinsReg" }}
                  >
                    <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      {selectedRoundUser.status === "evaluate"
                        ? "Your submission is currently under evaluation. We'll notify you once results are ready."
                        : "Submissions are no longer accepted for this task. The deadline has passed."}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center p-4">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400 text-lg" style={{ fontFamily: "PoppinsReg" }}>
              Select a domain to view your task
            </p>
            <p className="text-gray-600 text-sm mt-2" style={{ fontFamily: "PoppinsReg" }}>
              Choose from the sidebar to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TaskClient;
