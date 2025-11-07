const EMAIL_ENV_KEYS = [
  "GATED_ALLOWED_EMAILS",
  "ALLOWED_EMAILS",
  "NEXT_PUBLIC_GATED_ALLOWED_EMAILS",
  "NEXT_PUBLIC_ALLOWED_EMAILS",
  "gated_allowed_emails",
  "allowed_emails",
  "next_public_gated_allowed_emails",
  "next_public_allowed_emails",
] as const;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const parseEmails = (raw: string) =>
  raw
    .split(/[\s,;]+/)
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

export const getAllowedEmailList = () => {
  const rawValue = EMAIL_ENV_KEYS.map((key) => process.env[key]).find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (!rawValue) return [];
  return parseEmails(rawValue);
};

export const isEmailAllowed = (email?: string | null) => {
  const allowedEmails = getAllowedEmailList();
  if (!email) return false;
  if (allowedEmails.length === 0) return false;
  return allowedEmails.includes(normalizeEmail(email));
};
