"use server";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { cacheTags } from "@/lib/cache-tags";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function updateDetails(phone: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "User is not logged in!";
    }
    const updateDetails = await prisma.user.update({
      where: {
        id: user.session.userId,
      },
      data: {
        phone: phone,
      },
    });
    updateTag(cacheTags.user(user.session.userId));
    return updateDetails;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("error in updating the details");
  }
}
