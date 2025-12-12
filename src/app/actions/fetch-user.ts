"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function fetchUser() {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "user not logged in!";
    }

    const fetchUser = await prisma.user.findUnique({
      where: {
        id: user.session.userId,
      },
    });

    return fetchUser;
  } catch (e) {
    console.error("Error: ", e);
    // throw new Error("User not found");
    return null;
  }
}
