require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const results = await prisma.$queryRaw`
      SELECT
        R.id AS round_id,
        R.number AS round_number,
        R.domain AS round_domain,
        COUNT(*) AS submitted_submissions_count
      FROM "FormSubmission" FS
      JOIN "RoundUser" RU ON FS."roundUserId" = RU.id
      JOIN "Round" R ON RU."roundId" = R.id
      WHERE FS."formSubmittedAt" IS NOT NULL
      GROUP BY R.id, R.number, R.domain
      ORDER BY submitted_submissions_count DESC
    `;

    console.log("\nSubmitted form submissions count per round:");
    console.table(results);

    const totalSubmitted = results.reduce(
      (sum, row) => sum + Number(row.submitted_submissions_count),
      0,
    );
    console.log(
      `\nTotal unique submitted form submissions across all domains: ${totalSubmitted}`,
    );

    const [{ uniqueusers }] = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT RU."userId") AS uniqueUsers
      FROM "RoundUser" RU
      JOIN "FormSubmission" FS ON RU.id = FS."roundUserId"
      WHERE FS."formSubmittedAt" IS NOT NULL
    `;
    console.log(
      `Unique users with at least one submitted form: ${uniqueusers}`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
