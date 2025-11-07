import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { isEmailAllowed } from "./allowed-emails";
import { prisma } from "./prisma";

const throwEmailNotAllowed = (email?: string | null) => {
  throw new APIError("FORBIDDEN", {
    code: "FORBIDDEN_EMAIL",
    message: email
      ? `${email} is not allow-listed for this deployment.`
      : "Your account is not allow-listed for this deployment.",
  });
};

const enforceAllowedEmail = (email?: string | null) => {
  if (!isEmailAllowed(email)) {
    throwEmailNotAllowed(email);
  }
};

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "cockroachdb",
  }),
  session: {
    fields: {
      expiresAt: "expires",
      token: "sessionToken",
    },
  },
  account: {
    fields: {
      providerId: "provider",
      accountId: "providerAccountId",
      refreshToken: "refresh_token",
      accessToken: "access_token",
      accessTokenExpiresAt: "expires_at",
      idToken: "id_token",
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      hd: "vitstudent.ac.in",
      accessType: "offline",
      prompt: "select_account consent",
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          enforceAllowedEmail(user.email ?? null);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (!session.userId) {
            throwEmailNotAllowed();
          }

          const dbUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });

          enforceAllowedEmail(dbUser?.email ?? null);
        },
      },
    },
  },

  plugins: [nextCookies()], //keep nextcookies at the end of this array
});
