"use server";

import clientPromise from "@/lib/mongo";

export async function logSearch(query: string, email?: string | null) {
  if (!query || query.length > 25 || !email) return;

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

    if (recentLogsCount >= 10) {
      return;
    }

    await collection.insertOne({
      query: query.trim(),
      email: email || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to log search:", error);
  }
}
