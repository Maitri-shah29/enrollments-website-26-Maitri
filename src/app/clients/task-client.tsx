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

const LinkifiedText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.match(/^(https?:\/\/[^\s]+)$/)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};

const TaskClient = ({ initialRoundUsers }: TaskClientProps) => {
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [allRoundUsers, setAllRoundUsers] =
    useState<RoundUserWithRelations[]>(initialRoundUsers);
  const [submissionText, setSubmissionText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!selectedRoundUser || !submissionText.trim()) {
      showNotification("Please enter your submission", "error");
      return;
    }

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

  const formatDeadline = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(d);
  };

  const isDeadlinePassed = (deadline: Date) => {
    return new Date(deadline) < new Date();
  };

  if (allRoundUsers.length === 0) {
    return (
      <div className="flex min-h-screen bg-black text-white font-sans items-center justify-center">
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
    <div className="flex min-h-screen bg-black text-white font-sans">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-35 right-10 z-50 p-4 rounded-lg border ${getNotificationClasses(
            notification.type,
          )}`}
        >
          {notification.message}
        </div>
      )}

      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6">
        <h2
          className="text-xl font-semibold mb-6"
          style={{ fontFamily: "PoppinsBlack" }}
        >
          Tasks
        </h2>
        <nav className="space-y-2">
          {availableDomains.map((domain) => (
            <button
              type="button"
              key={domain}
              onClick={() => setSelectedDomain(domain)}
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
      </aside>

      <main className="flex-1 p-8">
        {selectedRoundUser ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: "PoppinsBlack" }}
              >
                {selectedDomain} Task
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span
                  className="text-gray-400"
                  style={{ fontFamily: "PoppinsReg" }}
                >
                  Round {selectedRoundUser.round.number}
                </span>
                {selectedRoundUser.Task && (
                  <span
                    style={{ fontFamily: "PoppinsReg" }}
                    className={`${
                      isDeadlinePassed(selectedRoundUser.Task.deadline)
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    Deadline: {formatDeadline(selectedRoundUser.Task.deadline)}
                  </span>
                )}
              </div>
            </div>

            {/* Task Description */}
            {selectedRoundUser.Task && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: "PoppinsBlack" }}
                  >
                    Task Description
                  </h2>
                  <span
                    className="text-sm text-gray-400"
                    style={{ fontFamily: "PoppinsReg" }}
                  ></span>
                </div>
                <LinkifiedText
                  text={selectedRoundUser.Task.text}
                  className="text-gray-300 whitespace-pre-wrap bg-zinc-900 rounded-lg border border-zinc-800 min-y-[3rem] p-4"
                />
              </div>
            )}

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2
                  className="text-xl font-semibold"
                  style={{ fontFamily: "PoppinsBlack" }}
                >
                  Your Submission
                </h2>
                {selectedRoundUser.TaskSubmission && (
                  <span
                    className="text-sm text-gray-400"
                    style={{ fontFamily: "PoppinsReg" }}
                  >
                    Last submitted:{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(
                      new Date(selectedRoundUser.TaskSubmission.submittedAt),
                    )}
                  </span>
                )}
              </div>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                style={{ fontFamily: "PoppinsReg" }}
                placeholder="Enter your submission here..."
                className="w-full h-64 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={
                  submitting ||
                  Boolean(
                    selectedRoundUser.Task &&
                      isDeadlinePassed(selectedRoundUser.Task.deadline),
                  )
                }
              />
            </div>

            <button
              type="button"
              style={{ fontFamily: "PoppinsReg" }}
              onClick={handleSubmit}
              disabled={
                submitting ||
                !submissionText.trim() ||
                Boolean(
                  selectedRoundUser.Task &&
                    isDeadlinePassed(selectedRoundUser.Task.deadline),
                )
              }
              className="px-6 py-3 bg-sky-50 hover:bg-blue-700 text-gray-900 hover:text-sky-50 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors hover:border-white hover:border-1"
            >
              {submitting ? "Submitting..." : "Submit Task"}
            </button>

            {selectedRoundUser.Task &&
              isDeadlinePassed(selectedRoundUser.Task.deadline) && (
                <p
                  className="mt-4 text-red-400 text-sm"
                  style={{ fontFamily: "PoppinsReg" }}
                >
                  The deadline for this task has passed. Submissions are no
                  longer accepted.
                </p>
              )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400" style={{ fontFamily: "PoppinsReg" }}>
              Select a domain to view your task
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TaskClient;
