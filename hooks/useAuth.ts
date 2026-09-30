'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { authApi } from '@/lib/api/auth';
import { QUERY_KEYS } from '@/lib/constants';
import type { LoginCredentials, RegisterData } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/utils/toast';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Sync tokens from NextAuth session to localStorage
  useEffect(() => {
    if (session?.accessToken && session?.refreshToken) {
      apiClient.setTokens(session.accessToken, session.refreshToken);
    }
  }, [session]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await nextAuthSignIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      if (!response?.ok) {
        throw new Error('Échec de la connexion');
      }

      return response;
    },
    onSuccess: () => {
      showToast.success('Connexion réussie ! Redirection...');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    },
    onError: (error: Error) => {
      const errorMessages: Record<string, string> = {
        'Invalid email or password': 'Email ou mot de passe incorrect',
        'Account is inactive': 'Votre compte est inactif. Contactez l\'administrateur.',
        'Email not verified': 'Veuillez vérifier votre email avant de vous connecter',
        'Too many attempts': 'Trop de tentatives. Réessayez dans quelques minutes.',
        'Network Error': 'Erreur de connexion. Vérifiez votre connexion internet.',
        'Échec de la connexion': 'Impossible de se connecter. Veuillez réessayer.',
      };

      const errorMessage = errorMessages[error.message] || error.message || 'Une erreur est survenue';
      showToast.error(errorMessage);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: async (data) => {
      showToast.success('Inscription réussie ! Redirection...');
      // After registration, sign in with NextAuth
      await nextAuthSignIn('credentials', {
        email: data.user.email,
        redirect: false,
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    },
    onError: (error: Error) => {
      console.error('Register error:', error);
      const errorMessage = error.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
      showToast.error(errorMessage);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authApi.logout();
      await nextAuthSignOut({ redirect: false });
    },
    onSuccess: () => {
      showToast.success('Déconnexion réussie');
      queryClient.clear();
      setTimeout(() => {
        router.push('/auth/login');
        router.refresh();
      }, 500);
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      const errorMessage = error.message || 'Une erreur est survenue lors de la déconnexion. Veuillez réessayer.';
      showToast.error(errorMessage);
    },
  });

  return {
    user: session?.user,
    session,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
