import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return new Response(JSON.stringify(session ?? null), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
