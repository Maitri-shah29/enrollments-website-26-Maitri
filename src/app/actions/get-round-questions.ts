"use server";

import { prisma } from "@/lib/prisma";
import type { RuleType, ValidationRuleInput } from "@/lib/validation";

type QuestionPayload = {
  id: string;
  serial: number;
  question: string;
  helpText?: string | null;
  varName?: string | null;
  type?: string | null;
  options?: unknown;
  validators: ValidationRuleInput[];
};

function mapRule(r: {
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

export default async function getRoundQuestions(roundId: string) {
  if (!roundId) return { questions: [] as QuestionPayload[] };

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

  const payload: QuestionPayload[] = questions.map((q) => ({
    id: q.id,
    serial: q.serial,
    question: q.question,
    helpText: q.helpText,
    varName: q.varName,
    type: q.type,
    options: q.options,
    validators: q.validators.map(mapRule),
  }));

  return { questions: payload };
}
