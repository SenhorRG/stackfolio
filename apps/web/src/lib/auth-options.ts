import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import {
  SESSION_MAX_AGE_DEFAULT_SECONDS,
  SESSION_MAX_AGE_REMEMBER_SECONDS,
} from '@/features/auth/constants/session-max-age';
import { loginAccount } from '@/features/auth/services/auth-api';
import { resolveOAuthUser } from '@/features/auth/services/resolve-oauth-user';
import { signApiToken } from './sign-api-token';

type CredentialsUser = User & { rememberMe?: boolean };

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const rememberMe = credentials.rememberMe === 'true';
        try {
          const user = await loginAccount({
            email: credentials.email.trim(),
            password: credentials.password,
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            rememberMe,
          };
        } catch (err) {
          if (err instanceof Error && err.message) {
            throw new Error(err.message);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_REMEMBER_SECONDS,
  },
  jwt: { maxAge: SESSION_MAX_AGE_REMEMBER_SECONDS },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'github') {
        const ghProfile = profile as { email?: string; name?: string } | undefined;
        const email = ghProfile?.email ?? user?.email;
        if (email) {
          const dbUser = await resolveOAuthUser({
            email,
            name: ghProfile?.name ?? user?.name,
          });
          if (dbUser) {
            token.sub = dbUser.id;
            token.email = dbUser.email;
            token.apiToken = signApiToken(
              { sub: dbUser.id, email: dbUser.email },
              '30d',
            );
            token.exp =
              Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_REMEMBER_SECONDS;
            return token;
          }
        }
      }

      const credUser = user as CredentialsUser | undefined;
      if (credUser?.id && credUser.email) {
        const rememberMe = credUser.rememberMe ?? false;
        const maxAge = rememberMe
          ? SESSION_MAX_AGE_REMEMBER_SECONDS
          : SESSION_MAX_AGE_DEFAULT_SECONDS;
        token.sub = credUser.id;
        token.email = credUser.email;
        token.rememberMe = rememberMe;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
        token.apiToken = signApiToken(
          { sub: credUser.id, email: credUser.email ?? undefined },
          rememberMe ? '30d' : '1d',
        );
      } else if (!token.apiToken && token.sub && token.email) {
        const rememberMe = token.rememberMe === true;
        token.apiToken = signApiToken(
          { sub: token.sub as string, email: token.email as string | undefined },
          rememberMe ? '30d' : '1d',
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      session.apiToken = token.apiToken as string;
      return session;
    },
  },
  pages: { signIn: '/login', newUser: '/register' },
};
