import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authApi } from '@/lib/api/auth';
import type { User } from '@/types/auth';

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        try {
          console.log('Attempting login with:', {
            email: credentials.email,
            passwordLength: (credentials.password as string).length
          });

          const response = await authApi.login({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          console.log('Login response:', {
            hasUser: !!response.user,
            hasTokens: !!(response.accessToken && response.refreshToken)
          });

          if (response.user) {
            return {
              id: response.user.id.toString(),
              email: response.user.email,
              name: `${response.user.firstName} ${response.user.lastName}`,
              image: response.user.avatar || undefined,
              role: response.user.role,
              tenantId: response.user.tenantId,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              tenant: response.tenant ? {
                id: response.tenant.id,
                name: response.tenant.name,
                slug: response.tenant.slug,
                email: response.tenant.email,
                phone: response.tenant.phone,
                address: response.tenant.address,
                status: response.tenant.status,
              } : undefined,
            };
          }

          return null;
        } catch (error: any) {
          console.error('Login error details:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status
          });
          throw new Error(error?.message || 'Identifiants invalides');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user && user.id) {
        token.id = user.id;
        token.email = user.email ?? '';
        token.name = user.name ?? '';
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.tenant = user.tenant;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | null;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.tenant = token.tenant;
      }

      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
