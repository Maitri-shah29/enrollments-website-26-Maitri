export type RoundStatus = "pending" | "evaluate" | "promoted" | "rejected";

export type RoundGateState =
  | "content"
  | "inactive"
  | "evaluating"
  | "announced_pending"
  | "promoted"
  | "rejected";

type RoundGateInput = {
  isActive: boolean;
  isAnnounced: boolean;
  status?: RoundStatus | null;
};

export const getRoundGateState = ({
  isActive,
  isAnnounced,
  status,
}: RoundGateInput): RoundGateState => {
  const normalized = status ?? "pending";
  if (isAnnounced) {
    switch (normalized) {
      case "promoted":
        return "promoted";
      case "rejected":
      case "evaluate":
        return "rejected";
      case "pending":
      default:
        return "announced_pending";
    }
  }

  if (!isActive) return "inactive";
  if (normalized !== "pending") return "evaluating";
  return "content";
};
