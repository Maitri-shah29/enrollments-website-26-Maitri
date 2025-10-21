import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  type RuleType,
  type ValidationRuleInput,
  validateAnswer,
} from "@/lib/validation";

type Body = {
  questionId: string;
  response: string | null;
};

function mapRuleToClient(r: {
  ruleType: string;
  ruleValue: string | null;
  helpText: string;
  helpTitle: string;
  priority: number;
}): ValidationRuleInput {
  return {
    type: r.ruleType as RuleType,
    value: r.ruleValue ?? undefined,
    message: r.helpText || r.helpTitle || undefined,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  const { formId } = await params;
  if (!formId)
    return NextResponse.json({ error: "formId required" }, { status: 400 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { questionId, response } = body;
  if (!questionId)
    return NextResponse.json({ error: "questionId required" }, { status: 400 });

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        varName: true,
        validators: {
          select: {
            ruleType: true,
            ruleValue: true,
            helpText: true,
            helpTitle: true,
            priority: true,
          },
          orderBy: { priority: "asc" },
        },
      },
    });

    if (!question)
      return NextResponse.json(
        { error: "question not found" },
        { status: 404 },
      );

    const existing = await prisma.response.findMany({
      where: { formId },
      select: {
        response: true,
        question: { select: { varName: true } },
      },
    });

    const answersByVar: Record<string, string> = {};
    for (const r of existing) {
      const name = r.question.varName;
      if (name) answersByVar[name] = r.response ?? "";
    }

    if (question.varName) {
      answersByVar[question.varName] = response ?? "";
    }

    const rules: ValidationRuleInput[] =
      question.validators.map(mapRuleToClient);
    const result = validateAnswer(response ?? "", rules, { answersByVar });
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "invalid value" },
        { status: 400 },
      );
    }

    const saved = await prisma.response.upsert({
      where: { questionId_formId: { questionId, formId } },
      update: { response: response ?? null, error: null },
      create: { questionId, formId, response: response ?? null, error: null },
      select: { id: true, questionId: true, formId: true, response: true },
    });

    return NextResponse.json({ response: saved });
  } catch (e) {
    console.error("[POST /api/forms/:formId/responses]", e);
    return NextResponse.json(
      { error: "failed to save response" },
      { status: 500 },
    );
  }
}
