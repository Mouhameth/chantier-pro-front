'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { showToast } from '@/lib/utils/toast';
import type { ApiResponse } from '@/types/api';

interface JoinResponse {
  sessionId: number;
  blueprintId: number;
  pageId: number;
  pageName?: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

/**
 * Page to join a collaborative session via invitation link
 */
export default function CollaborationJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [joinData, setJoinData] = useState<JoinResponse | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Aucun token d\'invitation fourni');
      return;
    }

    joinSession(token);
  }, [token]);

  const joinSession = async (inviteToken: string) => {
    try {
      setStatus('loading');

      const response = await apiClient.post<ApiResponse<JoinResponse>>(
        '/metrage/sessions/join',
        { token: inviteToken }
      );

      setJoinData(response.data);
      setStatus('success');

      showToast.success('Vous avez rejoint la session avec succès');

      // Redirect to the metrage page after 2 seconds
      setTimeout(() => {
        router.push(`/metres/${response.data.pageId}`);
      }, 2000);
    } catch (error: any) {
      console.error('[CollaborationJoin] Failed to join session:', error);
      setStatus('error');

      const message = error.message || 'Erreur lors de la connexion à la session';
      setErrorMessage(message);
      showToast.error(message);
    }
  };

  const handleRetry = () => {
    if (token) {
      joinSession(token);
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion en cours...
            </h2>
            <p className="text-gray-600">
              Nous vous connectons à la session collaborative
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && joinData && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Session rejointe avec succès!
            </h2>
            <p className="text-gray-600 mb-4">
              Vous allez être redirigé vers la page de métrage...
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                {joinData.pageName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Page:</span>
                    <span className="font-medium text-gray-900">{joinData.pageName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Rôle:</span>
                  <span className="font-medium text-gray-900">
                    {getRoleLabel(joinData.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de connexion
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>

            <div className="space-y-2">
              {token && (
                <button
                  onClick={handleRetry}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Réessayer
                </button>
              )}
              <button
                onClick={handleGoHome}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <UserPlus className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>
              Vous rejoignez une session de travail collaborative. Vous pourrez voir les autres
              participants et collaborer en temps réel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get role label in French
 */
function getRoleLabel(role: 'OWNER' | 'EDITOR' | 'VIEWER'): string {
  const labels = {
    OWNER: 'Propriétaire',
    EDITOR: 'Éditeur',
    VIEWER: 'Observateur',
  };
  return labels[role];
}
