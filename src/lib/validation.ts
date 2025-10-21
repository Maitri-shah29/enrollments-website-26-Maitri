export type RuleType = "requiredIf" | "required" | "min" | "max" | "custom";

export interface ValidationRuleInput {
  type: RuleType;
  // For min/max: number (length for strings), for requiredIf: "varName=value" or just "varName"
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

// Helper: determine if a string looks numeric
function looksNumeric(s: string): boolean {
  return /^-?\d*(?:\.\d+)?$/.test(s.trim());
}

export function validateAnswer(
  answer: string,
  rules: ValidationRuleInput[] | undefined,
  context?: ValidationContext,
): ValidationResult {
  const value = answer ?? "";
  const trimmed = value.trim();
  const ctx = context ?? {};

  const effectiveRules: ValidationRuleInput[] =
    rules && rules.length
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
        const min =
          typeof rule.value === "number" ? rule.value : Number(rule.value ?? 0);
        // By default, treat as min length for strings; if numeric, check numeric min
        if (looksNumeric(trimmed)) {
          const n = Number(trimmed);
          if (Number.isFinite(min) && n < min) {
            return {
              valid: false,
              error: msg || `Value must be at least ${min}`,
            };
          }
        } else if (Number.isFinite(min) && trimmed.length < min) {
          return {
            valid: false,
            error: msg || `Must be at least ${min} characters`,
          };
        }
        break;
      }
      case "max": {
        const max =
          typeof rule.value === "number"
            ? rule.value
            : Number(rule.value ?? Infinity);
        if (looksNumeric(trimmed)) {
          const n = Number(trimmed);
          if (Number.isFinite(max) && n > max) {
            return {
              valid: false,
              error: msg || `Value must be at most ${max}`,
            };
          }
        } else if (Number.isFinite(max) && trimmed.length > max) {
          return {
            valid: false,
            error: msg || `Must be at most ${max} characters`,
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
