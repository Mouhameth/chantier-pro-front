'use client';

import React, { useState } from 'react';
import { UserPlus, Copy, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { showToast } from '@/lib/utils/toast';
import type { ApiResponse } from '@/types/api';
import type { InviteLink } from '@/types/collaboration';

interface InviteButtonProps {
  sessionId: number;
  className?: string;
}

/**
 * Component to generate and share invitation links for collaborative sessions
 */
export const InviteButton: React.FC<InviteButtonProps> = ({ sessionId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteLink | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateInvite = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<ApiResponse<InviteLink>>(
        `/metrage/sessions/${sessionId}/invite`
      );
      setInviteData(response.data);
      setIsOpen(true);
    } catch (error: any) {
      console.error('[InviteButton] Failed to generate invite:', error);
      showToast.error(error.message || 'Erreur lors de la génération du lien');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteData) return;

    try {
      await navigator.clipboard.writeText(inviteData.link);
      setCopied(true);
      showToast.success('Lien copié dans le presse-papier');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[InviteButton] Failed to copy link:', error);
      showToast.error('Erreur lors de la copie du lien');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCopied(false);
  };

  const formatExpirationDate = (expiresAt: string): string => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} jours`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}min`;
    } else {
      return `${diffMinutes} minutes`;
    }
  };

  return (
    <>
      <button
        onClick={handleGenerateInvite}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Inviter des collaborateurs"
      >
        <UserPlus className="w-4 h-4" />
        <span>Inviter</span>
      </button>

      {/* Modal */}
      {isOpen && inviteData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Inviter des collaborateurs</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">
              Partagez ce lien avec vos collaborateurs pour qu&apos;ils rejoignent cette session
              de travail.
            </p>

            {/* Link display and copy button */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteData.link}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-xs font-medium">Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expiration info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Expire dans:</span>
              <span className="font-medium text-gray-700">
                {formatExpirationDate(inviteData.expiresAt)}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
