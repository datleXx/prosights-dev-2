import NextAuth, {
  DefaultSession,
  getServerSession,
  type NextAuthOptions,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";
import { Adapter } from "next-auth/adapters";

// Module augmentation for `next-auth` types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      refreshToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken: string;
    refreshToken: string;
  }
}

// Options for NextAuth.js
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          access_type: 'offline',  // Ensure the refresh token is requested
          prompt: 'consent',  // Force reconsent to ensure a refresh token is issued
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt'
  }
  ,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        console.log("JWT User -- ", user); //debugging line
        token.id = user.id;
      }
      if (account) {
        console.log("JWT Account -- ", account); //debugging line
        token.accessToken = account.access_token!;
        token.refreshToken = account.refresh_token!;
      }
      console.log("JWT Account -- ", account); //debugging line
      return token;
    },
    async session({ session, token }) {
      console.log("JWT token -- ", token); //debugging line
      // Ensure token is properly set
      if (token?.id) {
        session.user.id = token.id;
      }
      if (token?.accessToken) {
        session.user.accessToken = token.accessToken;
      }
      if (token?.refreshToken) {
        session.user.refreshToken = token.refreshToken;
      }
      console.log("Next Auth session", session);
      return session;
    },
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
};

// Wrapper for `getServerSession`
export const getServerAuthSession = () => getServerSession(authOptions);

export default NextAuth(authOptions);
