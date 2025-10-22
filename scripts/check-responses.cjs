/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (trimmed.startsWith("DATABASE_URL=")) {
        let val = trimmed.slice("DATABASE_URL=".length).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        return val;
      }
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

async function main() {
  const formIdArg = process.argv[2];
  const dbUrl = readDatabaseUrl();
  if (!dbUrl) {
    console.error(
      "DATABASE_URL not found. Set it in environment or .env file.",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    if (formIdArg) {
      const count = await prisma.response.count({
        where: { formId: formIdArg },
      });
      const rows = await prisma.response.findMany({
        where: { formId: formIdArg },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          formId: true,
          questionId: true,
          response: true,
          createdAt: true,
          question: { select: { varName: true } },
        },
      });
      console.log(`Responses for formId=${formIdArg} (count=${count}):`);
      console.table(
        rows.map((r) => ({
          id: r.id,
          varName: r.question?.varName,
          response: r.response,
          createdAt: r.createdAt,
        })),
      );
    } else {
      const rows = await prisma.response.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          formId: true,
          questionId: true,
          response: true,
          createdAt: true,
          question: { select: { varName: true } },
        },
      });
      console.log("Latest 10 responses:");
      console.table(
        rows.map((r) => ({
          id: r.id,
          formId: r.formId,
          varName: r.question?.varName,
          response: r.response,
          createdAt: r.createdAt,
        })),
      );
    }
  } catch (e) {
    console.error("Failed querying DB:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
