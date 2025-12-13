import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getRequestSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getRequestUserId(): Promise<string | null> {
  const session = await getRequestSession();
  return session?.session?.userId ?? null;
}
