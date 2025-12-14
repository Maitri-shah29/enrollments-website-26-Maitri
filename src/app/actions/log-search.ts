"use server";

import clientPromise from "@/lib/mongo";

const filters = [
  "research",
  "design",
  "tech",
  "management",
  "cc",
  "domain",
  "events",
];
export async function logSearch(query: string, email?: string | null) {
  // console.log("hii");
  if (!query || query.length > 25 || !email || filters.includes(query)) return;

  // if (!query || query.length > 25 || !email) return;
  try {
    const client = await clientPromise;
    const db = client.db("acm_enrollments");
    const collection = db.collection("user_searches");
    // Rate limiting
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentLogsCount = await collection.countDocuments({
      email: email,
      timestamp: { $gte: oneMinuteAgo },
    });

    console.log(recentLogsCount);
    if (recentLogsCount >= 10) {
      console.log("you have been rate limited");
      return;
    }

    await collection.insertOne({
      query: query.trim(),
      email: email || null,
      timestamp: new Date(),
    });
    // console.log("ajwwjd");
  } catch (error) {
    console.error("Failed to log search:", error);
  }
}
