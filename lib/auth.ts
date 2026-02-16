import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/server/prisma";

const defaultUsername = "demo";
const defaultPassword = "demo123";
const isDevelopment = process.env.NODE_ENV !== "production";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret-change-me",
  providers: isDevelopment
    ? [
        CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;

        const expectedUsername = process.env.AUTH_USERNAME ?? defaultUsername;
        const expectedPassword = process.env.AUTH_PASSWORD ?? defaultPassword;

        if (username === expectedUsername && password === expectedPassword) {
          const email = `${expectedUsername}@local.dev`;
          const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: { email },
            select: { id: true, email: true },
          });

          return {
            id: user.id,
            name: expectedUsername,
            email: user.email,
          };
        }

        return null;
      },
    }),
      ]
    : [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
