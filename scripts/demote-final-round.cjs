const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const email = process.argv[2] || "ishaan.deepak2023@vitstudent.ac.in";
const domain = (process.argv[3] || "tech").toLowerCase();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`No user found for email: ${email}`);
  }

  const round = await prisma.round.findFirst({
    where: { domain },
    orderBy: { number: "desc" },
    select: { id: true, number: true, type: true },
  });

  if (!round) {
    throw new Error(`No rounds found for domain: ${domain}`);
  }

  const roundUser = await prisma.roundUser.upsert({
    where: {
      roundId_userId: {
        roundId: round.id,
        userId: user.id,
      },
    },
    create: {
      roundId: round.id,
      userId: user.id,
      status: "rejected",
    },
    update: {
      status: "rejected",
    },
    select: { id: true, status: true },
  });

  console.log(
    `Demoted ${user.email} in ${domain} (Round ${round.number}, ${round.type}). RoundUser: ${roundUser.id}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
