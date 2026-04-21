import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    role: string;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    rememberMe?: boolean;
    sessionIssuedAt?: number;
    expiresAt?: number;
    absoluteExpiresAt?: number;
    lastValidatedAt?: number;
  }
}
