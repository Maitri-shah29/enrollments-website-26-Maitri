"use server";

import { prisma } from "@/lib/prisma";
import {
  type RuleType,
  type ValidationRuleInput,
  validateAnswer,
} from "@/lib/validation";

function mapRuleToClient(r: {
  ruleType: string;
  ruleValue: string | null;
  helpText: string;
  helpTitle: string;
  priority: number;
}): ValidationRuleInput {
  const type = r.ruleType as RuleType;
  // Convert numeric validators coming from Prisma (stored as strings) to numbers
  let value: string | number | undefined = r.ruleValue ?? undefined;
  if ((type === "min" || type === "max") && r.ruleValue != null) {
    const n = Number(r.ruleValue);
    value = Number.isFinite(n) ? n : undefined;
  }
  return {
    type,
    value,
    message: r.helpText || r.helpTitle || undefined,
  };
}

export default async function saveFormResponse(
  formId: string,
  questionId: string,
  response: string | null,
) {
  if (!formId) throw new Error("formId required");
  if (!questionId) throw new Error("questionId required");

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

  if (!question) throw new Error("question not found");

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

  const rules: ValidationRuleInput[] = question.validators.map(mapRuleToClient);
  const result = validateAnswer(response ?? "", rules, { answersByVar });
  if (!result.valid) {
    throw new Error(result.error || "invalid value");
  }

  const saved = await prisma.response.upsert({
    where: { questionId_formId: { questionId, formId } },
    update: { response: response ?? null, error: null },
    create: { questionId, formId, response: response ?? null, error: null },
    select: { id: true, questionId: true, formId: true, response: true },
  });

  return saved;
}
