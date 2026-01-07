"use server";

import { prisma } from "@/lib/prisma";
import { ADMIN_EMAILS } from "@/lib/admin-config";
import { getRequestUserId } from "@/lib/request-session";

export interface DomainEnrollment {
  roundUserId: string;
  domain: string;
  roundNumber: number;
  status: string;
  roundType: string;
  hasTask: boolean;
  hasMeetSlot: boolean;
}

export interface UserEnrollmentInfo {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  enrollments: DomainEnrollment[];
}

export async function fetchUserEnrollmentInfo(
  email: string
): Promise<UserEnrollmentInfo | null> {
  try {
    const requesterId = await getRequestUserId();
    if (!requesterId) {
      console.error("[fetchUserEnrollmentInfo] Unauthorized: No session");
      return null;
    }

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { email: true },
    });

    if (!requester?.email || !ADMIN_EMAILS.includes(requester.email)) {
      console.error("[fetchUserEnrollmentInfo] Unauthorized: Not an admin");
      return null;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        RoundUser: {
          select: {
            id: true,
            status: true,
            taskId: true,
            round: {
              select: {
                domain: true,
                number: true,
                type: true,
              },
            },
            Meet_User: {
              select: {
                id: true,
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

    if (!user || !user.email) {
      return null;
    }

    const enrollments: DomainEnrollment[] = user.RoundUser.map((ru) => ({
      roundUserId: ru.id,
      domain: ru.round.domain,
      roundNumber: ru.round.number,
      status: ru.status,
      roundType: ru.round.type,
      hasTask: !!ru.taskId,
      hasMeetSlot: !!ru.Meet_User,
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      enrollments,
    };
  } catch (error) {
    console.error("[fetchUserEnrollmentInfo] Error:", error);
    return null;
  }
}

export async function fetchUsersEnrollmentInfo(
  emails: string[]
): Promise<Map<string, UserEnrollmentInfo>> {
  try {
    const requesterId = await getRequestUserId();
    if (!requesterId) {
      console.error("[fetchUsersEnrollmentInfo] Unauthorized: No session");
      return new Map();
    }

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { email: true },
    });

    if (!requester?.email || !ADMIN_EMAILS.includes(requester.email)) {
      console.error("[fetchUsersEnrollmentInfo] Unauthorized: Not an admin");
      return new Map();
    }

    const normalizedEmails = emails.map((e) => e.toLowerCase().trim());

    const users = await prisma.user.findMany({
      where: {
        email: { in: normalizedEmails },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        RoundUser: {
          select: {
            id: true,
            status: true,
            taskId: true,
            round: {
              select: {
                domain: true,
                number: true,
                type: true,
              },
            },
            Meet_User: {
              select: {
                id: true,
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

    const result = new Map<string, UserEnrollmentInfo>();

    for (const user of users) {
      if (!user.email) continue;

      const enrollments: DomainEnrollment[] = user.RoundUser.map((ru) => ({
        roundUserId: ru.id,
        domain: ru.round.domain,
        roundNumber: ru.round.number,
        status: ru.status,
        roundType: ru.round.type,
        hasTask: !!ru.taskId,
        hasMeetSlot: !!ru.Meet_User,
      }));

      result.set(user.email.toLowerCase(), {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        enrollments,
      });
    }

    return result;
  } catch (error) {
    console.error("[fetchUsersEnrollmentInfo] Error:", error);
    return new Map();
  }
}
