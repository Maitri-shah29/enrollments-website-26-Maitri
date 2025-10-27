export type RuleType =
  | "requiredIf"
  | "required"
  | "min"
  | "max"
  | "pattern"
  | "custom";

export interface ValidationRuleInput {
  type: RuleType;
  // For min/max: number (length threshold for strings), for requiredIf: "varName=value" or just "varName"
  value?: string | number;
  //to display error msg when user fails-ideally do NOT use this until we wanna recreate CH tragedies
  message?: string;
}
export interface ValidationContext {
  // Map of other answers in the same form/round, keyed by varName
  answersByVar?: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export type QuestionPayload = {
  id: string;
  serial: number;
  question: string;
  helpText?: string | null;
  varName?: string | null;
  type?: string | null;
  options?: unknown;
  validators: ValidationRuleInput[];
};

export function validateAnswer(
  answer: string,
  rules: ValidationRuleInput[] | undefined,
  context?: ValidationContext,
): ValidationResult {
  const value = answer ?? "";
  const trimmed = value.trim();
  const ctx = context ?? {};

  const effectiveRules: ValidationRuleInput[] = rules?.length
    ? rules
    : [
        {
          type: "required",
          message: "This field is required and cannot be empty",
        },
      ];

  for (const rule of effectiveRules) {
    const msg = rule.message;
    switch (rule.type) {
      case "required": {
        if (trimmed.length === 0) {
          return {
            valid: false,
            error: msg || "This field is required and cannot be empty",
          };
        }
        break;
      }
      case "min": {
        // Treat as minimum length for strings only; ignore non-number values
        const minLen = typeof rule.value === "number" ? rule.value : undefined;
        if (
          typeof minLen === "number" &&
          Number.isFinite(minLen) &&
          trimmed.length < minLen
        ) {
          return {
            valid: false,
            error: msg || `Must be at least ${minLen} characters`,
          };
        }
        break;
      }
      case "max": {
        // Treat as maximum length for strings only; ignore non-number values
        const maxLen = typeof rule.value === "number" ? rule.value : undefined;
        if (
          typeof maxLen === "number" &&
          Number.isFinite(maxLen) &&
          trimmed.length > maxLen
        ) {
          return {
            valid: false,
            error: msg || `Must be at most ${maxLen} characters`,
          };
        }
        break;
      }
      case "requiredIf": {
        if (!rule.value) break;
        const raw = String(rule.value);
        const [varName, expected] = raw.split("=");
        const otherVal = ctx.answersByVar?.[varName];
        const conditionMet =
          expected === undefined
            ? Boolean(otherVal && otherVal.trim().length > 0)
            : (otherVal ?? "") === expected;
        if (conditionMet && trimmed.length === 0) {
          return { valid: false, error: msg || "This field is required" };
        }
        break;
      }
      case "pattern": {
        //left empty for now
        break;
      }
      case "custom": {
        //left empty for now
        break;
      }
      default:
        break;
    }
  }

  return { valid: true };
}
