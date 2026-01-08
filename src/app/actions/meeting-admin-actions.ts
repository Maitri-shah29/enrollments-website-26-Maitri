"use server";

import { prisma } from "@/lib/prisma";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { getRequestUserId } from "@/lib/request-session";

async function verifyAdmin(): Promise<string | null> {
  const requesterId = await getRequestUserId();
  if (!requesterId) return null;

  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { email: true },
  });

  if (!requester?.email || !ADMIN_EMAILS.includes(requester.email)) {
    return null;
  }

  return requester.email;
}
export interface MeetingRoundUser {
  id: string;
  status: string;
  roundId: string;
  userId: string;
  round: {
    id: string;
    domain: string;
    number: number;
    type: string;
  };
  Meet_User: {
    id: string;
    slotId: string;
  } | null;
  Task: {
    id: string;
    text: string;
    deadline: Date;
  } | null;
}

export interface MeetingUserDetails {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  roundUsers: MeetingRoundUser[];
}

export interface MeetingUserFullData {
  userDetails: MeetingUserDetails;
  comments: UserComment[];
  formSubmissions: UserFormSubmission[];
}

export interface UserComment {
  id: string;
  comment: string;
  by: string;
  for: string;
  time: Date;
}

export async function getMeetingUserDetails(
  email: string
): Promise<MeetingUserDetails | null> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    console.error("[getMeetingUserDetails] Unauthorized");
    return null;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        RoundUser: {
          select: {
            id: true,
            status: true,
            roundId: true,
            userId: true,
            taskId: true,
            round: {
              select: {
                id: true,
                domain: true,
                number: true,
                type: true,
              },
            },
            Meet_User: {
              select: {
                id: true,
                slotId: true,
              },
            },
            Task: {
              select: {
                id: true,
                text: true,
                deadline: true,
              },
            },
          },
          orderBy: [
            { round: { domain: "asc" } },
            { round: { number: "desc" } },
          ],
        },
      },
    });

    if (!user || !user.email) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roundUsers: user.RoundUser.map((ru) => ({
        id: ru.id,
        status: ru.status,
        roundId: ru.roundId,
        userId: ru.userId,
        round: {
          id: ru.round.id,
          domain: ru.round.domain,
          number: ru.round.number,
          type: ru.round.type,
        },
        Meet_User: ru.Meet_User,
        Task: ru.Task,
      })),
    };
  } catch (error) {
    console.error("[getMeetingUserDetails] Error:", error);
    return null;
  }
}

export async function getMeetingUserFullData(
  email: string
): Promise<MeetingUserFullData | null> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    console.error("[getMeetingUserFullData] Unauthorized");
    return null;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        RoundUser: {
          select: {
            id: true,
            status: true,
            roundId: true,
            userId: true,
            taskId: true,
            round: {
              select: {
                id: true,
                domain: true,
                number: true,
                type: true,
              },
            },
            Meet_User: {
              select: {
                id: true,
                slotId: true,
              },
            },
            Task: {
              select: {
                id: true,
                text: true,
                deadline: true,
              },
            },
            formSubmission: {
              select: {
                id: true,
                formSubmittedAt: true,
                valid: true,
                roundUserId: true,
                responses: {
                  select: {
                    id: true,
                    questionId: true,
                    response: true,
                    question: {
                      select: {
                        serial: true,
                        question: true,
                        type: true,
                        varName: true,
                      },
                    },
                  },
                  orderBy: {
                    question: {
                      serial: "asc",
                    },
                  },
                },
              },
            },
          },
          orderBy: [
            { round: { domain: "asc" } },
            { round: { number: "desc" } },
          ],
        },
        Comments: {
          select: {
            id: true,
            comment: true,
            by: true,
            for: true,
            time: true,
          },
          orderBy: { time: "desc" },
          take: 20,
        },
      },
    });

    if (!user || !user.email) return null;

    const formSubmissions: UserFormSubmission[] = [];
    for (const ru of user.RoundUser) {
      if (ru.round.type === "form" && ru.formSubmission) {
        formSubmissions.push({
          id: ru.formSubmission.id,
          formSubmittedAt: ru.formSubmission.formSubmittedAt,
          valid: ru.formSubmission.valid,
          roundUserId: ru.formSubmission.roundUserId,
          round: ru.round,
          responses: ru.formSubmission.responses.map((r) => ({
            id: r.id,
            questionId: r.questionId,
            response: r.response,
            question: r.question,
          })),
        });
      }
    }

    return {
      userDetails: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roundUsers: user.RoundUser.map((ru) => ({
          id: ru.id,
          status: ru.status,
          roundId: ru.roundId,
          userId: ru.userId,
          round: {
            id: ru.round.id,
            domain: ru.round.domain,
            number: ru.round.number,
            type: ru.round.type,
          },
          Meet_User: ru.Meet_User,
          Task: ru.Task,
        })),
      },
      comments: user.Comments,
      formSubmissions,
    };
  } catch (error) {
    console.error("[getMeetingUserFullData] Error:", error);
    return null;
  }
}

export interface VerifyAttendanceResult {
  success: boolean;
  error?: string;
  newStatus?: string;
}
export async function verifyMeetingAttendance(
  roundUserId: string
): Promise<VerifyAttendanceResult> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const roundUser = await prisma.roundUser.findUnique({
      where: { id: roundUserId },
      include: { round: true },
    });

    if (!roundUser) {
      return { success: false, error: "Round user not found" };
    }

    if (roundUser.status === "evaluate" || roundUser.status === "promoted") {
      return { success: false, error: "User already marked as attended" };
    }

    const updated = await prisma.roundUser.update({
      where: { id: roundUserId },
      data: { status: "evaluate" },
    });

    console.log(
      `[verifyMeetingAttendance] Admin ${adminEmail} verified attendance for ${roundUserId}`
    );

    return { success: true, newStatus: updated.status };
  } catch (error) {
    console.error("[verifyMeetingAttendance] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface PromoteUserResult {
  success: boolean;
  error?: string;
  newStatus?: string;
}

export async function promoteMeetingUser(
  roundUserId: string
): Promise<PromoteUserResult> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const roundUser = await prisma.roundUser.findUnique({
      where: { id: roundUserId },
      include: { round: true },
    });

    if (!roundUser) {
      return { success: false, error: "Round user not found" };
    }

    if (roundUser.status === "promoted") {
      return { success: false, error: "User already promoted" };
    }

    if (roundUser.status !== "evaluate") {
      return {
        success: false,
        error: "User must be in evaluate status to be promoted",
      };
    }

    const updated = await prisma.roundUser.update({
      where: { id: roundUserId },
      data: { status: "promoted" },
    });

    console.log(
      `[promoteMeetingUser] Admin ${adminEmail} promoted ${roundUserId}`
    );

    return { success: true, newStatus: updated.status };
  } catch (error) {
    console.error("[promoteMeetingUser] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface RejectUserResult {
  success: boolean;
  error?: string;
  newStatus?: string;
}

export async function rejectMeetingUser(
  roundUserId: string
): Promise<RejectUserResult> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const roundUser = await prisma.roundUser.findUnique({
      where: { id: roundUserId },
    });

    if (!roundUser) {
      return { success: false, error: "Round user not found" };
    }

    if (roundUser.status === "rejected") {
      return { success: false, error: "User already rejected" };
    }

    const updated = await prisma.roundUser.update({
      where: { id: roundUserId },
      data: { status: "rejected" },
    });

    console.log(
      `[rejectMeetingUser] Admin ${adminEmail} rejected ${roundUserId}`
    );

    return { success: true, newStatus: updated.status };
  } catch (error) {
    console.error("[rejectMeetingUser] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface AddCommentResult {
  success: boolean;
  error?: string;
  commentId?: string;
}

export async function addMeetingComment(
  userId: string,
  domain: string,
  comment: string
): Promise<AddCommentResult> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return { success: false, error: "Unauthorized" };
  }

  if (!comment.trim()) {
    return { success: false, error: "Comment cannot be empty" };
  }

  try {
    const validDomains = ["cc", "tech", "research", "management", "design"];
    const normalizedDomain = domain.toLowerCase();
    if (!validDomains.includes(normalizedDomain)) {
      return { success: false, error: "Invalid domain" };
    }

    const created = await prisma.comments.create({
      data: {
        userId,
        comment: comment.trim(),
        by: adminEmail,
        for: normalizedDomain as any,
      },
    });

    console.log(
      `[addMeetingComment] Admin ${adminEmail} added comment for user ${userId}`
    );

    return { success: true, commentId: created.id };
  } catch (error) {
    console.error("[addMeetingComment] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getMeetingUserComments(
  userId: string
): Promise<UserComment[]> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return [];
  }

  try {
    const comments = await prisma.comments.findMany({
      where: { userId },
      select: {
        id: true,
        comment: true,
        by: true,
        for: true,
        time: true,
      },
      orderBy: { time: "desc" },
      take: 20,
    });

    return comments;
  } catch (error) {
    console.error("[getMeetingUserComments] Error:", error);
    return [];
  }
}

export interface AssignTaskResult {
  success: boolean;
  error?: string;
  taskId?: string;
}

export async function assignMeetingTask(
  roundUserId: string,
  taskText: string,
  taskDeadline: Date
): Promise<AssignTaskResult> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return { success: false, error: "Unauthorized" };
  }

  if (!taskText.trim()) {
    return { success: false, error: "Task description cannot be empty" };
  }

  try {
    const roundUser = await prisma.roundUser.findUnique({
      where: { id: roundUserId },
      include: { round: true },
    });

    if (!roundUser) {
      return { success: false, error: "Round user not found" };
    }

    if (roundUser.status !== "evaluate") {
      return {
        success: false,
        error: "User must be verified (evaluate status) before assigning task",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const taskRound = await tx.round.findFirst({
        where: {
          domain: roundUser.round.domain as any,
          number: roundUser.round.number + 1,
          type: "task",
        },
      });

      if (!taskRound) {
        throw new Error(
          `No task round found for ${roundUser.round.domain} round ${roundUser.round.number + 1}`
        );
      }

      let taskRoundUser = await tx.roundUser.findFirst({
        where: {
          roundId: taskRound.id,
          userId: roundUser.userId,
        },
      });

      if (!taskRoundUser) {
        taskRoundUser = await tx.roundUser.create({
          data: {
            roundId: taskRound.id,
            userId: roundUser.userId,
            status: "pending",
          },
        });
      }

      const task = await tx.task.create({
        data: {
          text: taskText.trim(),
          deadline: taskDeadline,
          roundUserId: taskRoundUser.id,
          roundUser: {
            connect: { id: taskRoundUser.id },
          },
        },
      });

      await tx.roundUser.update({
        where: { id: roundUserId },
        data: { status: "promoted" },
      });

      return { taskId: task.id };
    });

    console.log(
      `[assignMeetingTask] Admin ${adminEmail} assigned task to ${roundUserId}`
    );

    return { success: true, taskId: result.taskId };
  } catch (error) {
    console.error("[assignMeetingTask] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface UpdateTaskResult {
  success: boolean;
  error?: string;
}

export async function updateMeetingTask(
  taskId: string,
  taskText: string,
  taskDeadline: Date
): Promise<UpdateTaskResult> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return { success: false, error: "Unauthorized" };
  }

  if (!taskText.trim()) {
    return { success: false, error: "Task description cannot be empty" };
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        text: taskText.trim(),
        deadline: taskDeadline,
      },
    });

    console.log(
      `[updateMeetingTask] Admin ${adminEmail} updated task ${taskId}`
    );

    return { success: true };
  } catch (error) {
    console.error("[updateMeetingTask] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface AvailableRound {
  id: string;
  domain: string;
  number: number;
  type: string;
  active: boolean;
}

export async function getActiveInterviewRounds(): Promise<AvailableRound[]> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return [];
  }

  try {
    const rounds = await prisma.round.findMany({
      where: {
        type: "interview",
        active: true,
      },
      select: {
        id: true,
        domain: true,
        number: true,
        type: true,
        active: true,
      },
      orderBy: [{ domain: "asc" }, { number: "asc" }],
    });

    return rounds;
  } catch (error) {
    console.error("[getActiveInterviewRounds] Error:", error);
    return [];
  }
}

export interface FormResponse {
  id: string;
  questionId: string;
  response: string | null;
  question: {
    serial: number;
    question: string;
    type: string;
    varName: string;
  };
}

export interface UserFormSubmission {
  id: string;
  formSubmittedAt: Date | null;
  valid: boolean;
  roundUserId: string;
  round: {
    id: string;
    domain: string;
    number: number;
    type: string;
  };
  responses: FormResponse[];
}

export async function getMeetingUserFormSubmissions(
  userId: string
): Promise<UserFormSubmission[]> {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return [];
  }
  if (!userId) {
    return [];
  }

  try {
    const roundUsers = await prisma.roundUser.findMany({
      where: {
        userId,
        round: {
          type: "form",
        },
      },
      select: {
        id: true,
        round: {
          select: {
            id: true,
            domain: true,
            number: true,
            type: true,
          },
        },
        formSubmission: {
          select: {
            id: true,
            formSubmittedAt: true,
            valid: true,
            roundUserId: true,
            responses: {
              select: {
                id: true,
                questionId: true,
                response: true,
                question: {
                  select: {
                    serial: true,
                    question: true,
                    type: true,
                    varName: true,
                  },
                },
              },
              orderBy: {
                question: {
                  serial: "asc",
                },
              },
            },
          },
        },
      },
      orderBy: [
        { round: { domain: "asc" } },
        { round: { number: "asc" } },
      ],
    });

    const submissions: UserFormSubmission[] = [];

    for (const ru of roundUsers) {
      if (ru.formSubmission) {
        submissions.push({
          id: ru.formSubmission.id,
          formSubmittedAt: ru.formSubmission.formSubmittedAt,
          valid: ru.formSubmission.valid,
          roundUserId: ru.formSubmission.roundUserId,
          round: ru.round,
          responses: ru.formSubmission.responses.map((r: { id: string; questionId: string; response: string | null; question: { serial: number; question: string; type: string; varName: string } }) => ({
            id: r.id,
            questionId: r.questionId,
            response: r.response,
            question: r.question,
          })),
        });
      }
    }

    return submissions;
  } catch (error) {
    console.error("[getMeetingUserFormSubmissions] Error:", error);
    return [];
  }
}
