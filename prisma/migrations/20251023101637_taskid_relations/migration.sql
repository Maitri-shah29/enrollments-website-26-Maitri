-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('form', 'interview', 'task');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('pending', 'evaluate', 'promoted', 'rejected');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('cc', 'web', 'app', 'research', 'management', 'design');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('stq', 'ltq', 'scq', 'mcq');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('requiredIf', 'required', 'min', 'max', 'pattern', 'custom');

-- CreateTable
CREATE TABLE "Round" (
    "id" STRING NOT NULL,
    "number" INT4 NOT NULL,
    "domain" "Domain" NOT NULL,
    "active" BOOL NOT NULL,
    "type" "RoundType" NOT NULL,
    "eliminates" BOOL NOT NULL,
    "announced" BOOL NOT NULL,
    "hidden" BOOL NOT NULL DEFAULT false,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundUser" (
    "id" STRING NOT NULL,
    "roundId" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" STRING,

    CONSTRAINT "RoundUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "provider" STRING NOT NULL,
    "providerAccountId" STRING NOT NULL,
    "refresh_token" STRING,
    "access_token" STRING,
    "expires_at" TIMESTAMP(3),
    "token_type" STRING,
    "scope" STRING,
    "id_token" STRING,
    "session_state" STRING,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" STRING NOT NULL,
    "sessionToken" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" STRING,
    "userAgent" STRING,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" STRING NOT NULL,
    "identifier" STRING NOT NULL,
    "value" STRING NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "name" STRING,
    "email" STRING,
    "emailVerified" BOOL NOT NULL DEFAULT false,
    "image" STRING,
    "phone" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" STRING NOT NULL,
    "endpoint" STRING NOT NULL,
    "p256dh" STRING NOT NULL,
    "auth" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formSubmittedAt" TIMESTAMP(3),
    "roundUserId" STRING NOT NULL,
    "valid" BOOL NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" STRING NOT NULL,
    "serial" INT4 NOT NULL,
    "question" STRING NOT NULL,
    "helpText" STRING,
    "roundId" STRING NOT NULL,
    "type" "Type" NOT NULL,
    "options" STRING[],
    "varName" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" STRING NOT NULL,
    "questionId" STRING NOT NULL,
    "formId" STRING NOT NULL,
    "response" STRING,
    "error" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationRule" (
    "id" STRING NOT NULL,
    "questionId" STRING NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "ruleValue" STRING,
    "priority" INT4 NOT NULL,
    "helpText" STRING NOT NULL,
    "helpTitle" STRING NOT NULL,

    CONSTRAINT "ValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "comment" STRING NOT NULL,
    "by" STRING NOT NULL,
    "for" "Domain" NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meet" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "roundId" STRING NOT NULL,
    "meetLink" STRING NOT NULL,
    "schedulingLink" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" STRING NOT NULL,
    "roundUserId" STRING NOT NULL,
    "text" STRING NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meet_User" (
    "id" STRING NOT NULL,
    "roundUserId" STRING NOT NULL,
    "slotId" STRING NOT NULL,

    CONSTRAINT "Meet_User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" STRING NOT NULL,
    "roundUserId" STRING NOT NULL,
    "text" STRING NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" STRING NOT NULL,
    "meetId" STRING NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "capacity" INT4 NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round_domain_number_key" ON "Round"("domain", "number");

-- CreateIndex
CREATE UNIQUE INDEX "RoundUser_roundId_userId_key" ON "RoundUser"("roundId", "userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_roundUserId_key" ON "FormSubmission"("roundUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_questionId_formId_key" ON "Response"("questionId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "Meet_roundId_key" ON "Meet"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_roundUserId_key" ON "Task"("roundUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Meet_User_roundUserId_key" ON "Meet_User"("roundUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSubmission_roundUserId_key" ON "TaskSubmission"("roundUserId");

-- AddForeignKey
ALTER TABLE "RoundUser" ADD CONSTRAINT "RoundUser_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundUser" ADD CONSTRAINT "RoundUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundUser" ADD CONSTRAINT "RoundUser_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_roundUserId_fkey" FOREIGN KEY ("roundUserId") REFERENCES "RoundUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_formId_fkey" FOREIGN KEY ("formId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationRule" ADD CONSTRAINT "ValidationRule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meet" ADD CONSTRAINT "Meet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meet_User" ADD CONSTRAINT "Meet_User_roundUserId_fkey" FOREIGN KEY ("roundUserId") REFERENCES "RoundUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meet_User" ADD CONSTRAINT "Meet_User_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_roundUserId_fkey" FOREIGN KEY ("roundUserId") REFERENCES "RoundUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_meetId_fkey" FOREIGN KEY ("meetId") REFERENCES "Meet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
