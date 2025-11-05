import { Domain } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ensureRoundUser from "../../actions/ensure-round-user";
import fetchRoundUser from "../../actions/fetch-round-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainStr = searchParams.get("domain") || "cc";
  let enumDomain: Domain;
  switch (domainStr.toLowerCase()) {
    case "cc":
      enumDomain = Domain.cc;
      break;
    case "tech":
      enumDomain = Domain.tech;
      break;
    case "research":
      enumDomain = Domain.research;
      break;
    case "management":
      enumDomain = Domain.management;
      break;
    case "design":
      enumDomain = Domain.design;
      break;
    default:
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }
  try {
    // Find the round for the domain and type 'form'
    const round = await prisma.round.findFirst({
      where: {
        domain: enumDomain,
        type: "form",
      },
      select: { id: true },
    });
    if (!round) {
      return NextResponse.json(
        { error: "No round found for domain" },
        { status: 404 },
      );
    }
    // Ensure round user exists
    await ensureRoundUser(round.id);
    // Fetch round user
    const roundUser = await fetchRoundUser(domainStr);

    // Ensure form submission exists if roundUser exists
    if (
      roundUser &&
      typeof roundUser === "object" &&
      !roundUser.formSubmission
    ) {
      await prisma.formSubmission.create({
        data: {
          roundUserId: roundUser.id,
          valid: false,
        },
      });
      // Fetch again to get the form submission
      const updatedRoundUser = await fetchRoundUser(domainStr);
      return NextResponse.json(updatedRoundUser);
    }

    return NextResponse.json(roundUser);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch round user" },
      { status: 500 },
    );
  }
}
