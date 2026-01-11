"use client";

import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Loader2,
  MessageSquare,
  Phone,
  UserCheck,
  UserX,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMeetingComment,
  assignMeetingTask,
  getMeetingUserComments,
  getMeetingUserDetails,
  getMeetingUserFormSubmissions,
  promoteMeetingUser,
  rejectMeetingUser,
  updateMeetingTask,
  verifyMeetingAttendance,
  type MeetingRoundUser,
  type MeetingUserDetails,
  type UserFormSubmission,
} from "@/app/actions/meeting-admin-actions";
import type { Participant } from "../types";
import { formatDisplayName } from "../utils";

interface AdminActionsSidebarProps {
  participantUserId: string;
  participants: Map<string, Participant>;
  onClose: () => void;
  getDisplayName: (userId: string) => string;
}

export default function AdminActionsSidebar({
  participantUserId,
  participants,
  onClose,
  getDisplayName,
}: AdminActionsSidebarProps) {
  const [userDetails, setUserDetails] = useState<MeetingUserDetails | null>(
    null
  );
  const [comments, setComments] = useState<
    { id: string; comment: string; by: string; time: Date }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "info" | "actions" | "comments" | "form"
  >("actions");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskRoundUserId, setTaskRoundUserId] = useState<string | null>(null);
  const [taskDomain, setTaskDomain] = useState<string | null>(null);
  const [taskText, setTaskText] = useState("");
  const [taskDeadline, setTaskDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentDomain, setCommentDomain] = useState<string>("");

  const [formSubmissions, setFormSubmissions] = useState<UserFormSubmission[]>(
    []
  );
  const [selectedFormSubmission, setSelectedFormSubmission] =
    useState<UserFormSubmission | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const email = participantUserId.split("#")[0] || participantUserId;
  const participant = participants.get(participantUserId);
  const displayName = participant
    ? getDisplayName(participant.userId)
    : formatDisplayName(email);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setComments([]);
        setFormSubmissions([]);
        setSelectedFormSubmission(null);
        setCommentsLoaded(false);
        setFormLoaded(false);
        setCommentsError(null);
        setFormError(null);
        setCommentsLoading(false);
        setFormLoading(false);

        const data = await getMeetingUserDetails(email);

        if (cancelled) return;

        if (data) {
          setUserDetails(data);

          if (data.roundUsers.length > 0) {
            setCommentDomain(data.roundUsers[0].round.domain);
          }
        } else {
          setError("User not found in system");
        }
      } catch (err) {
        if (cancelled) return;
        setError("Failed to load details");
        console.error("[AdminActionsSidebar] Error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const loadComments = useCallback(
    async (options?: { force?: boolean }) => {
      if (!userDetails?.id) return;
      if (commentsLoaded && !options?.force) return;

      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const data = await getMeetingUserComments(userDetails.id);
        setComments(data);
        setCommentsLoaded(true);
      } catch (err) {
        console.error("[AdminActionsSidebar] Comment load error:", err);
        setCommentsError("Failed to load comments");
      } finally {
        setCommentsLoading(false);
      }
    },
    [userDetails?.id, commentsLoaded]
  );

  const loadFormSubmissions = useCallback(
    async (options?: { force?: boolean }) => {
      if (!userDetails?.id) return;
      if (formLoaded && !options?.force) return;

      setFormLoading(true);
      setFormError(null);
      try {
        const data = await getMeetingUserFormSubmissions(userDetails.id);
        setFormSubmissions(data);
        setFormLoaded(true);
      } catch (err) {
        console.error("[AdminActionsSidebar] Form load error:", err);
        setFormError("Failed to load form submissions");
      } finally {
        setFormLoading(false);
      }
    },
    [userDetails?.id, formLoaded]
  );

  useEffect(() => {
    if (activeTab !== "comments") return;
    if (commentsLoaded || commentsLoading) return;
    loadComments();
  }, [activeTab, commentsLoaded, commentsLoading, loadComments]);

  useEffect(() => {
    if (activeTab !== "form") return;
    if (formLoaded || formLoading) return;
    loadFormSubmissions();
  }, [activeTab, formLoaded, formLoading, loadFormSubmissions]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showTaskModal) {
          setShowTaskModal(false);
        } else if (showCommentModal) {
          setShowCommentModal(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, showTaskModal, showCommentModal]);

  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  const refreshUserDetails = async () => {
    if (!email) return;

    try {
      const data = await getMeetingUserDetails(email);
      if (data) {
        setUserDetails(data);
      }
    } catch (err) {
      console.error("[AdminActionsSidebar] Refresh error:", err);
    }
  };

  const refreshComments = async () => {
    await loadComments({ force: true });
  };

  const handleVerifyAttendance = async (roundUser: MeetingRoundUser) => {
    setActionLoading(`verify-${roundUser.id}`);
    setActionError(null);

    const result = await verifyMeetingAttendance(roundUser.id);

    setActionLoading(null);
    if (result.success) {
      setActionSuccess(`Attendance verified for ${roundUser.round.domain}`);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to verify attendance");
    }
  };

  const handlePromote = async (roundUser: MeetingRoundUser) => {
    setActionLoading(`promote-${roundUser.id}`);
    setActionError(null);

    const result = await promoteMeetingUser(roundUser.id);

    setActionLoading(null);
    if (result.success) {
      setActionSuccess(`Promoted in ${roundUser.round.domain}`);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to promote user");
    }
  };

  const handleReject = async (roundUser: MeetingRoundUser) => {
    setActionLoading(`reject-${roundUser.id}`);
    setActionError(null);

    const result = await rejectMeetingUser(roundUser.id);

    setActionLoading(null);
    if (result.success) {
      setActionSuccess(`Rejected from ${roundUser.round.domain}`);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to reject user");
    }
  };

  const openTaskModal = (
    roundUserId: string,
    domain: string,
    existingTask?: { id: string; text: string; deadline: Date }
  ) => {
    setTaskRoundUserId(roundUserId);
    setTaskDomain(domain);
    if (existingTask) {
      setEditingTaskId(existingTask.id);
      setTaskText(existingTask.text);
      const d = new Date(existingTask.deadline);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setTaskDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setEditingTaskId(null);
      setTaskText("");
      const d = new Date();
      d.setDate(d.getDate() + 4);
      d.setHours(23, 59, 0, 0);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setTaskDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
    setShowTaskModal(true);
  };

  const handleAssignTask = async () => {
    if (!taskRoundUserId || !taskText.trim()) return;

    setActionLoading("task");
    setActionError(null);

    const result = await assignMeetingTask(
      taskRoundUserId,
      taskText.trim(),
      new Date(taskDeadline)
    );

    setActionLoading(null);
    if (result.success) {
      setActionSuccess("Task assigned & promoted");
      setShowTaskModal(false);
      setTaskRoundUserId(null);
      setTaskDomain(null);
      setTaskText("");
      setEditingTaskId(null);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to assign task");
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !taskText.trim()) return;

    setActionLoading("task");
    setActionError(null);

    const result = await updateMeetingTask(
      editingTaskId,
      taskText.trim(),
      new Date(taskDeadline)
    );

    setActionLoading(null);
    if (result.success) {
      setActionSuccess("Task updated");
      setShowTaskModal(false);
      setTaskRoundUserId(null);
      setTaskDomain(null);
      setTaskText("");
      setEditingTaskId(null);
      await refreshUserDetails();
    } else {
      setActionError(result.error || "Failed to update task");
    }
  };

  const handleAddComment = async () => {
    if (!userDetails || !commentText.trim() || !commentDomain) return;

    setActionLoading("comment");
    setActionError(null);

    const result = await addMeetingComment(
      userDetails.id,
      commentDomain,
      commentText.trim()
    );

    setActionLoading(null);
    if (result.success) {
      setActionSuccess("Comment added");
      setShowCommentModal(false);
      setCommentText("");
      await refreshComments();
    } else {
      setActionError(result.error || "Failed to add comment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "promoted":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "evaluate":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "pending":
      default:
        return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case "tech":
        return "text-blue-400";
      case "design":
        return "text-pink-400";
      case "management":
        return "text-amber-400";
      case "research":
        return "text-purple-400";
      case "cc":
        return "text-cyan-400";
      default:
        return "text-neutral-400";
    }
  };

  const formatDomain = (domain: string) => {
    if (domain.toLowerCase() === "cc") return "CC";
    return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
  };

  const uniqueDomains = useMemo(() => {
    if (!userDetails?.roundUsers) return [];
    return [...new Set(userDetails.roundUsers.map((ru) => ru.round.domain))];
  }, [userDetails?.roundUsers]);

  const actionableRounds = useMemo(() => {
    if (!userDetails?.roundUsers) return [];
    return userDetails.roundUsers.filter(
      (ru) => ru.round.type === "interview" || ru.round.type === "task"
    );
  }, [userDetails?.roundUsers]);

  return (
    <>
      <div
        className="absolute right-2 sm:right-4 top-2 sm:top-4 bottom-16 sm:bottom-20 w-[calc(100%-1rem)] sm:w-80 md:w-96 bg-[#1f1f1f] rounded-lg shadow-2xl flex flex-col border border-white/5 z-20 animate-in slide-in-from-right-4 duration-200"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 p-3 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-sm font-medium shrink-0">
            {displayName[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {userDetails?.name || displayName}
            </h3>
            <p className="text-[10px] text-neutral-500 truncate">{email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {(actionSuccess || actionError) && (
          <div
            className={`mx-3 mt-2 px-2.5 py-1.5 rounded text-[11px] flex items-center gap-1.5 ${
              actionSuccess
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {actionSuccess ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            <span className="truncate">{actionSuccess || actionError}</span>
          </div>
        )}

        <div className="flex border-b border-white/5 shrink-0">
          {(["actions", "form", "info", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[10px] font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "text-white border-b-2 border-blue-500"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab === "form" ? "Form" : tab}
              {tab === "comments" && ` (${comments.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
              <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs">{error}</p>
            </div>
          ) : activeTab === "actions" ? (
            <div className="space-y-2">
              {actionableRounds.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No enrollments found</p>
                </div>
              ) : (
                actionableRounds.map((ru) => (
                  <div
                    key={ru.id}
                    className="p-3 bg-[#252525] rounded-lg border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold ${getDomainColor(
                            ru.round.domain
                          )}`}
                        >
                          {formatDomain(ru.round.domain)}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          R{ru.round.number} •{" "}
                          {ru.round.type === "task" ? "Task" : "Interview"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full border capitalize ${getStatusColor(
                          ru.status
                        )}`}
                      >
                        {ru.status}
                      </span>
                    </div>

                    {ru.Meet_User && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-400 mb-2">
                        <Calendar className="w-3 h-3" />
                        Meeting slot booked
                      </div>
                    )}

                    {ru.Task && (
                      <button
                        onClick={() =>
                          openTaskModal(ru.id, ru.round.domain, {
                            id: ru.Task!.id,
                            text: ru.Task!.text,
                            deadline: ru.Task!.deadline,
                          })
                        }
                        className="w-full text-left mb-2 p-2 bg-green-500/10 hover:bg-green-500/20 rounded border border-green-500/20 hover:border-green-500/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between text-green-400 text-[10px] mb-1">
                          <div className="flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" />
                            <span className="font-medium">Task Assigned</span>
                          </div>
                          <span className="text-[9px] text-neutral-500 group-hover:text-green-400 transition-colors">
                            Edit
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-300 line-clamp-2">
                          {ru.Task.text}
                        </p>
                        <p className="text-[9px] text-neutral-500 mt-1">
                          Due: {new Date(ru.Task.deadline).toLocaleString()}
                        </p>
                      </button>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {ru.round.type === "interview" &&
                        ru.status === "pending" && (
                          <button
                            onClick={() => handleVerifyAttendance(ru)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/20 transition-colors disabled:opacity-50 font-medium"
                          >
                            {actionLoading === `verify-${ru.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            Verify Attendance
                          </button>
                        )}

                      {ru.round.type === "interview" &&
                        ru.status === "evaluate" &&
                        !ru.Task &&
                        ru.round.domain !== "management" && (
                          <button
                            onClick={() =>
                              openTaskModal(ru.id, ru.round.domain)
                            }
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/30 transition-colors disabled:opacity-50 font-medium"
                          >
                            <ClipboardList className="w-3 h-3" />
                            Assign Task & Promote
                          </button>
                        )}

                      {ru.round.type === "interview" &&
                        (ru.status === "pending" ||
                          ru.status === "evaluate") && (
                          <button
                            onClick={() => handleReject(ru)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors disabled:opacity-50 font-medium"
                          >
                            {actionLoading === `reject-${ru.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                        )}

                      {ru.round.type === "interview" &&
                        ru.status === "promoted" && (
                          <div className="flex items-center gap-1 text-[10px] text-green-400">
                            <Check className="w-3 h-3" />
                            Promoted
                          </div>
                        )}

                      {ru.round.type === "interview" &&
                        ru.status === "rejected" && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400">
                            <X className="w-3 h-3" />
                            Rejected
                          </div>
                        )}

                      {ru.round.type === "task" && (
                        <div
                          className={`flex items-center gap-1 text-[10px] ${
                            ru.status === "pending"
                              ? "text-yellow-400"
                              : ru.status === "promoted"
                              ? "text-green-400"
                              : ru.status === "rejected"
                              ? "text-red-400"
                              : "text-neutral-400"
                          }`}
                        >
                          {ru.status === "pending" ? (
                            <>
                              <ClipboardList className="w-3 h-3" />
                              Task Pending
                            </>
                          ) : ru.status === "promoted" ? (
                            <>
                              <Check className="w-3 h-3" />
                              Task Completed
                            </>
                          ) : ru.status === "rejected" ? (
                            <>
                              <X className="w-3 h-3" />
                              Task Failed
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "info" ? (
            <div className="space-y-2">
              {userDetails?.phone && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 p-2 bg-[#252525] rounded border border-white/5">
                  <Phone className="w-3.5 h-3.5" />
                  {userDetails.phone}
                </div>
              )}
              {userDetails?.roundUsers.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <p className="text-xs">No domain enrollments</p>
                </div>
              ) : (
                userDetails?.roundUsers.map((ru) => (
                  <div
                    key={ru.id}
                    className="flex items-center justify-between p-2 bg-[#252525] rounded border border-white/5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-medium ${getDomainColor(
                          ru.round.domain
                        )}`}
                      >
                        {formatDomain(ru.round.domain)}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        R{ru.round.number} · {ru.round.type}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full border capitalize ${getStatusColor(
                        ru.status
                      )}`}
                    >
                      {ru.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "form" ? (
            <div className="space-y-2">
              {formLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                </div>
              ) : formError ? (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
                  <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-xs">{formError}</p>
                </div>
              ) : formSubmissions.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No form submissions</p>
                </div>
              ) : (
                formSubmissions.map((fs) => (
                  <div
                    key={fs.id}
                    className="bg-[#252525] rounded border border-white/5 overflow-hidden"
                  >
                    <button
                      className="w-full p-2 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors text-left"
                      onClick={() => {
                        setSelectedFormSubmission(
                          selectedFormSubmission?.id === fs.id ? null : fs
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${getDomainColor(
                            fs.round.domain
                          )}`}
                        >
                          {formatDomain(fs.round.domain)}
                        </span>
                        <span className="text-[9px] text-neutral-500">
                          R{fs.round.number} · {fs.responses.length} Q&A
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
                          selectedFormSubmission?.id === fs.id
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>
                    {selectedFormSubmission?.id === fs.id && (
                      <div className="border-t border-white/5 p-2 space-y-2 max-h-[300px] overflow-y-auto">
                        {fs.responses.length === 0 ? (
                          <p className="text-[10px] text-neutral-500 text-center py-2">
                            No responses
                          </p>
                        ) : (
                          fs.responses.map((response, idx) => (
                            <div
                              key={response.id}
                              className="p-2 bg-[#1f1f1f] rounded border border-white/5"
                            >
                              <p className="text-[10px] font-medium text-neutral-400 mb-1">
                                Q{idx + 1}: {response.question?.question || "Unknown question"}
                              </p>
                              <p className="text-[11px] text-white whitespace-pre-wrap">
                                {response.response || (
                                  <span className="text-neutral-500 italic">
                                    No response
                                  </span>
                                )}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                </div>
              ) : commentsError ? (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
                  <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-xs">{commentsError}</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No comments yet</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-[#252525] rounded border border-white/5"
                  >
                    <p className="text-xs text-neutral-300">{c.comment}</p>
                    <p className="text-[9px] text-neutral-500 mt-1.5">
                      {c.by} ·{" "}
                      {new Date(c.time).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/5 shrink-0">
          <button
            onClick={() => setShowCommentModal(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded border border-white/5 transition-colors font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Add Comment
          </button>
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#1f1f1f] border border-white/10 rounded-lg w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ fontFamily: "'Roboto', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white">
                {editingTaskId ? "Edit Task" : "Assign Task & Promote"}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Task Description
                </label>
                <textarea
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="Describe the task..."
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Deadline (your local time)
                </label>
                <input
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-2 p-3 border-t border-white/5">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-2 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTaskId ? handleUpdateTask : handleAssignTask}
                disabled={!taskText.trim() || actionLoading === "task"}
                className="flex-1 py-2 text-xs text-white bg-green-600 hover:bg-green-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {actionLoading === "task" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ClipboardList className="w-3 h-3" />
                )}
                {editingTaskId ? "Update Task" : "Assign & Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div
            className="bg-[#1f1f1f] border border-white/10 rounded-lg w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ fontFamily: "'Roboto', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-white">Add Comment</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Domain
                </label>
                <select
                  value={commentDomain}
                  onChange={(e) => setCommentDomain(e.target.value)}
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  {uniqueDomains.map((d) => (
                    <option key={d} value={d} className="bg-[#1f1f1f]">
                      {formatDomain(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">
                  Comment
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment..."
                  className="w-full bg-[#252525] border border-white/5 rounded px-2.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 p-3 border-t border-white/5">
              <button
                onClick={() => setShowCommentModal(false)}
                className="flex-1 py-2 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={
                  !commentText.trim() ||
                  !commentDomain ||
                  actionLoading === "comment"
                }
                className="flex-1 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {actionLoading === "comment" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MessageSquare className="w-3 h-3" />
                )}
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
