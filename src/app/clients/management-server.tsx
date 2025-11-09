"use server";
import type { Domain } from "@prisma/client";
import createFormSubmission from "@/app/actions/create-form-submission";
import ensureRoundUser from "@/app/actions/ensure-round-user";
import fetchRound from "@/app/actions/fetch-round-details";
import getRoundQuestions from "@/app/actions/get-round-questions";
import ManagementClient from "@/app/clients/management-client";

export default async function ManagementServer() {
  try {
    const domain: Domain = "management";
    const rounds = await fetchRound(domain);

    if (!Array.isArray(rounds) || rounds.length === 0) {
      // not logged in or no rounds available => fallback
      return <ManagementClient />;
    }

    const round = rounds[0];
    const roundId = round.id;
    let initialQuestions:
      | import("@/lib/validation").QuestionPayload[]
      | undefined;
    let initialFormId: string | null = null;
    let initError: string | null = null;
    let formWarning: string | null = null;

    try {
      const qres = await getRoundQuestions(roundId);
      if (qres && qres.questions) {
        initialQuestions = qres.questions.sort(
          (a, b) => (a.serial ?? 0) - (b.serial ?? 0),
        );
      }
    } catch (e) {
      initError = "Failed to load questions.";
    }

    // Ensure round user
    const ensureRes = await ensureRoundUser(roundId);
    if ("error" in ensureRes && ensureRes.error === "Not logged in") {
      initError = "Please sign in to answer questions.";
      return (
        <ManagementClient
          initialRoundId={roundId}
          initialQuestions={initialQuestions}
          initialInitError={initError}
        />
      );
    }
    if ("error" in ensureRes && ensureRes.error) {
      formWarning =
        "Could not link you to this round automatically; you can view questions but cannot save answers.";
    }

    // Create form submission
    const createRes = await createFormSubmission(roundId);
    if ("formSubmission" in createRes && createRes.formSubmission) {
      initialFormId = createRes.formSubmission.id;
    } else if ("error" in createRes) {
      if (createRes.error === "Not logged in") {
        initError = "Please sign in to answer questions.";
      } else if (createRes.error === "User does not exist for this round") {
        formWarning =
          "You're not registered for this round yet; you can view questions but cannot save answers.";
      }
    }

    return (
      <ManagementClient
        initialRoundId={roundId}
        initialQuestions={initialQuestions}
        initialFormId={initialFormId}
        initialInitError={initError}
        initialFormWarning={formWarning}
      />
    );
  } catch (e) {
    console.error("ManagementServer error", e);
    return <ManagementClient />;
  }
}
