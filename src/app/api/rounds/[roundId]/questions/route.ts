import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RuleType } from "@/lib/validation";

function mapRule(r: {
  ruleType: string;
  ruleValue: string | null;
  helpText: string;
  helpTitle: string;
  priority: number;
}) {
  return {
    type: r.ruleType as RuleType,
    value: r.ruleValue ?? undefined,
    message: r.helpText || r.helpTitle || undefined,
    priority: r.priority,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  const { roundId } = await params;
  if (!roundId)
    return NextResponse.json({ error: "roundId required" }, { status: 400 });

  try {
    const questions = await prisma.question.findMany({
      where: { roundId },
      orderBy: { serial: "asc" },
      select: {
        id: true,
        serial: true,
        question: true,
        helpText: true,
        varName: true,
        type: true,
        options: true,
        validators: {
          orderBy: { priority: "asc" },
          select: {
            ruleType: true,
            ruleValue: true,
            helpText: true,
            helpTitle: true,
            priority: true,
          },
        },
      },
    });

    const payload = questions.map((q) => ({
      id: q.id,
      serial: q.serial,
      question: q.question,
      helpText: q.helpText,
      varName: q.varName,
      type: q.type,
      options: q.options,
      validators: q.validators.map(mapRule),
    }));

    return NextResponse.json({ questions: payload });
  } catch (e) {
    console.error("[GET /api/rounds/:roundId/questions]", e);
    return NextResponse.json(
      { error: "failed to fetch questions" },
      { status: 500 },
    );
  }
}
