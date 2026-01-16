import type { Domain } from "./domain";

export type RoundType = "form" | "interview" | "task";

export type ResultStatus = "promoted" | "not_promoted" | "pending";

export type DomainResult = {
  domain: Domain;
  label: string;
  lastRoundNumber: number | null;
  lastRoundType: RoundType | null;
  status: ResultStatus;
};

export type ResultsSummary = {
  domains: DomainResult[];
  promotedDomains: Domain[];
  primaryDomain: Domain | null;
  primaryStatus: ResultStatus;
  primaryLabel: string | null;
};
