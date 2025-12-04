"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function submitForm(
  roundUserId: string,
  currentResponses: Record<string, string>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // Verify the round user belongs to the current user
    const roundUser = await prisma.roundUser.findUnique({
      where: { id: roundUserId },
      select: {
        userId: true,
        round: {
          select: {
            Question: {
              select: {
                id: true,
                type: true,
              },
            },
          },
        },
        formSubmission: {
          select: {
            id: true,
            responses: {
              select: {
                questionId: true,
                response: true,
              },
            },
          },
        },
      },
    });

    if (!roundUser) {
      return { error: "Round user not found" };
    }

    if (roundUser.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    // Get all subjective questions (stq and ltq)
    const subjectiveQuestions = roundUser.round.Question.filter(
      (q) => q.type === "stq" || q.type === "ltq",
    );

    // Check if formSubmission exists
    if (!roundUser.formSubmission) {
      return {
        error:
          "No form submission found. Please answer at least one question first.",
      };
    }

    const formSubmissionId = roundUser.formSubmission.id;

    // For tech domain: only validate questions that are in currentResponses (selected AOIs)
    // For other domains (CC, etc): currentResponses will contain all questions
    const questionsToValidate = subjectiveQuestions.filter(
      (q) => q.id in currentResponses,
    );

    if (questionsToValidate.length === 0) {
      return {
        error: "No questions to submit. Please answer at least one question.",
      };
    }

    // Check if all selected questions are answered in current responses
    const unansweredQuestions = questionsToValidate.filter(
      (q) => !currentResponses[q.id] || currentResponses[q.id].trim() === "",
    );

    if (unansweredQuestions.length > 0) {
      return {
        error: `Cannot submit: ${unansweredQuestions.length} question(s) not filled completely. Please answer all selected questions before submitting.`,
      };
    }

    // Save all responses before submitting (only for selected questions)
    try {
      const savePromises = questionsToValidate.map((question) => {
        const response = currentResponses[question.id] || "";
        return prisma.response.upsert({
          where: {
            questionId_formId: {
              questionId: question.id,
              formId: formSubmissionId,
            },
          },
          update: {
            response: response || null,
            updatedAt: new Date(),
          },
          create: {
            questionId: question.id,
            formId: formSubmissionId,
            response: response || null,
          },
        });
      });

      await Promise.all(savePromises);
    } catch (saveError) {
      console.error("Error saving responses:", saveError);
      return { error: "Failed to save responses before submission" };
    }

    // Now validate the saved responses
    const savedResponses = await prisma.response.findMany({
      where: {
        formId: formSubmissionId,
        questionId: {
          in: questionsToValidate.map((q) => q.id),
        },
      },
      select: {
        questionId: true,
        response: true,
      },
    });

    // Validate that all selected questions have been saved
    if (savedResponses.length !== questionsToValidate.length) {
      return {
        error: `Please answer all selected questions. You have answered ${savedResponses.length} out of ${questionsToValidate.length} questions.`,
      };
    }

    // Validate that all responses are non-empty
    const emptyResponses = savedResponses.filter(
      (r) => !r.response || r.response.trim() === "",
    );

    if (emptyResponses.length > 0) {
      return {
        error: `Please provide answers for all selected questions. ${emptyResponses.length} question(s) have empty responses.`,
      };
    }

    // Update status to evaluate
    const updated = await prisma.roundUser.update({
      where: { id: roundUserId },
      data: {
        status: "evaluate",
        formSubmission: {
          update: {
            formSubmittedAt: new Date(),
          },
        },
      },
    });

    return { success: true, roundUser: updated };
  } catch (error) {
    console.error("Error submitting form:", error);
    return { error: "Failed to submit form" };
  }
}
