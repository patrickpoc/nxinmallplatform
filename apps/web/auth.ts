import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@nxinmall/database";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * NextAuth configuration (v5 beta) merged with the domain `User` model in Prisma.
 * OAuth accounts persist via `Account`; credentials auth compares `passwordHash` on `User`.
 * JWT sessions carry `role` for fast RBAC in middleware/layouts without a DB round-trip per request.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          return null;
        }
        const trimmed = email.trim().toLowerCase();
        const lookupEmail = trimmed === "admin" ? "admin@nxinmall.local" : trimmed;
        const user = await prisma.user.findUnique({ where: { email: lookupEmail } });
        if (!user?.passwordHash) {
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (user?.id) {
        token.sub = user.id;
        const role = (user as { role?: string }).role;
        if (role) {
          token.role = role;
        } else {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          token.role = dbUser?.role ?? "BUYER";
        }
      }
      if (account && token.sub && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        token.role = dbUser?.role ?? "BUYER";
      }
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string) ?? "BUYER";
      }
      return session;
    },
  },
});
