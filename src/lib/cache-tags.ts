export const cacheTags = {
  rounds: (domain: string) => `rounds:${domain}`,
  roundQuestions: (roundId: string) => `round-questions:${roundId}`,
  user: (userId: string) => `user:${userId}`,
  homeRoundUserCount: (userId: string) => `home-round-user-count:${userId}`,
  homePromotedDomains: (userId: string) => `home-promoted-domains:${userId}`,
  roundUser: (userId: string, domain: string) =>
    `round-user:${userId}:${domain}`,
  tasks: (userId: string) => `tasks:${userId}`,
  formSubmission: (roundUserId: string) => `form-submission:${roundUserId}`,
  responses: (formSubmissionId: string) => `responses:${formSubmissionId}`,
  questionResponse: (userId: string, formId: string, questionId: string) =>
    `response:${userId}:${formId}:${questionId}`,
};
