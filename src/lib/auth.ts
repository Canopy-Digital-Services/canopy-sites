import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcrypt";
import type { JWT } from "next-auth/jwt";

// Session timeout constants (in seconds)
const IDLE_TIMEOUT_DEFAULT = 4 * 60 * 60; // 4 hours
const IDLE_TIMEOUT_REMEMBER = 7 * 24 * 60 * 60; // 7 days
const ABSOLUTE_TIMEOUT_DEFAULT = 7 * 24 * 60 * 60; // 7 days
const ABSOLUTE_TIMEOUT_REMEMBER = 30 * 24 * 60 * 60; // 30 days
const VALIDATION_INTERVAL = 5 * 60; // 5 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValidPassword) {
          // Track failed login attempt
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: { increment: 1 },
              lastFailedLoginAt: new Date(),
            },
          });
          return null;
        }

        // Track successful login and reset failed attempts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            failedLoginCount: 0,
            lastFailedLoginAt: null,
          },
        });

        return {
          id: user.id,
          email: user.email,
          rememberMe: credentials.rememberMe === "true",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (cookie ceiling)
    updateAge: 5 * 60, // Re-sign JWT every 5 minutes
  },
  callbacks: {
    async jwt({ token: rawToken, user }) {
      const token = rawToken as JWT;
      const now = Math.floor(Date.now() / 1000);

      // Initial login: set all session claims
      if (user) {
        const remember = (user as { rememberMe?: boolean }).rememberMe === true;
        const idleTimeout = remember
          ? IDLE_TIMEOUT_REMEMBER
          : IDLE_TIMEOUT_DEFAULT;
        const absoluteTimeout = remember
          ? ABSOLUTE_TIMEOUT_REMEMBER
          : ABSOLUTE_TIMEOUT_DEFAULT;

        token.id = user.id!;
        token.email = user.email;
        token.rememberMe = remember;
        token.sessionIssuedAt = now;
        token.expiresAt = now + idleTimeout;
        token.absoluteExpiresAt = now + absoluteTimeout;
        token.lastValidatedAt = now;
        return token;
      }

      // Subsequent requests: check expiry
      // 1. Check absolute timeout (hard ceiling, never rolls)
      if (token.absoluteExpiresAt && now >= token.absoluteExpiresAt) {
        return expireToken(token);
      }

      // 2. Check idle timeout
      if (token.expiresAt && now >= token.expiresAt) {
        return expireToken(token);
      }

      // 3. Roll idle timeout forward
      const idleTimeout = token.rememberMe
        ? IDLE_TIMEOUT_REMEMBER
        : IDLE_TIMEOUT_DEFAULT;
      token.expiresAt = now + idleTimeout;

      // 4. Periodic password-change validation (every 5 minutes)
      if (
        token.lastValidatedAt &&
        now - token.lastValidatedAt >= VALIDATION_INTERVAL
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { passwordChangedAt: true },
          });

          // If user deleted or password changed after session was issued
          if (!dbUser) {
            return expireToken(token);
          }

          if (
            dbUser.passwordChangedAt &&
            token.sessionIssuedAt &&
            dbUser.passwordChangedAt.getTime() / 1000 >
              token.sessionIssuedAt
          ) {
            return expireToken(token);
          }

          token.lastValidatedAt = now;
        } catch {
          // On DB error, don't expire — just skip validation this cycle
        }
      }

      return token;
    },
    async session({ session, token: rawToken }) {
      const token = rawToken as JWT;
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.email = token.email as string;
      } else {
        // Token expired: clear user identity so requireAuth catches it
        session.user.id = "";
        session.user.email = "";
      }
      return session;
    },
  },
});

/** Strip identity claims to signal an expired session */
function expireToken(token: JWT): JWT {
  delete (token as Partial<JWT>).id;
  delete token.email;
  delete token.rememberMe;
  delete token.sessionIssuedAt;
  delete token.expiresAt;
  delete token.absoluteExpiresAt;
  delete token.lastValidatedAt;
  return token;
}
