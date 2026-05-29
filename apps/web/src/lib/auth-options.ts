import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { loginAccount } from '@/features/auth/services/auth-api';
import { resolveOAuthUser } from '@/features/auth/services/resolve-oauth-user';
import { signApiToken } from './sign-api-token';

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        try {
          const user = await loginAccount({
            email: credentials.email,
            password: credentials.password,
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
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
            token.apiToken = signApiToken({
              sub: dbUser.id,
              email: dbUser.email,
            });
            return token;
          }
        }
      }

      if (user?.id && user.email) {
        token.sub = user.id;
        token.email = user.email;
        token.apiToken = signApiToken({
          sub: user.id,
          email: user.email ?? undefined,
        });
      } else if (!token.apiToken && token.sub && token.email) {
        token.apiToken = signApiToken({
          sub: token.sub as string,
          email: token.email as string | undefined,
        });
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
