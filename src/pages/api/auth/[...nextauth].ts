import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, req) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return { id: user.id.toString(), email: user.email };
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: "/auth/signout",
    error: "/auth/error",
    newUser: null,
  },
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      // ログアウト後にホームページ（'/'）にリダイレクトする
      if (url === baseUrl + '/auth/signout') {
        return baseUrl + '/';
      }
      return url;
    }
  },
  // Enable debug messages in the console if you are having problems
  debug: process.env.NODE_ENV === 'development',
};
export default NextAuth(authOptions);
