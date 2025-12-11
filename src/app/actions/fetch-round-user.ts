"use server";
// import { Domain, RoundStatus } from "@prisma/client";
import { Domain } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { DOMAIN_CAP } from "../../lib/constants";
import { prisma } from "../../lib/prisma";
export default async function fetchRoundUser(domain: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "user is not logged in!";
    }

    // const roundUserCount = await prisma.roundUser.count({
    //   where: {
    //     userId: user.session.userId,
    //     status: { not: "pending" },
    //     round: {
    //       number: 1,
    //       type: "form",
    //     },
    //   },
    // });

    // if (roundUserCount >= 2) {
    //   return "You have already enrolled in 2 domains. Maximum is 2.";
    // }

    let enumDomain: Domain;
    if (domain.toLowerCase() === "cc") {
      enumDomain = Domain.cc;
    } else if (domain.toLowerCase() === "tech") {
      enumDomain = Domain.tech;
    } else if (domain.toLowerCase() === "research") {
      enumDomain = Domain.research;
    } else if (domain.toLowerCase() === "management") {
      enumDomain = Domain.management;
    } else if (domain.toLowerCase() === "design") {
      enumDomain = Domain.design;
    } else {
      throw new Error("Invalid domain provided");
    }

    const round = await prisma.round.findFirst({
      where: {
        domain: enumDomain,
        type: "form",
        active: true,
        number: 1,
      },
      select: {
        hidden: true,
      },
    });

    const basicRoundUser = await prisma.roundUser.findFirst({
      where: {
        round: {
          domain: enumDomain,
          type: "form",
          number: 1,
          active: true,
        },
        userId: user.session.userId,
      },
      include: {
        round: true,
        Task: true,
        Meet_User: true,
        user: true,
      },
    });

    if (!basicRoundUser) {
      return null;
    }

    // if (!round?.hidden && basicRoundUser.status === RoundStatus.pending) {
    //this breaks a bunch of promoted checks so sending questions to clients for now
    if (!round?.hidden) {
      const [questions, formSubmission] = await Promise.all([
        prisma.question.findMany({
          where: {
            roundId: basicRoundUser.roundId,
          },
          orderBy: {
            serial: "asc",
          },
        }),
        prisma.formSubmission.findFirst({
          where: {
            roundUserId: basicRoundUser.id,
          },
          include: {
            responses: true,
          },
        }),
      ]);

      return {
        ...basicRoundUser,
        round: {
          ...basicRoundUser.round,
          Question: questions,
        },
        formSubmission,
      };
    }

    return {
      ...basicRoundUser,
      round: {
        ...basicRoundUser.round,
        Question: [],
      },
      formSubmission: null,
    };
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching round user");
  }
}
