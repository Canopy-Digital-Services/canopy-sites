import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rememberMe?: boolean;
    sessionIssuedAt?: number;
    expiresAt?: number;
    absoluteExpiresAt?: number;
    lastValidatedAt?: number;
  }
}
