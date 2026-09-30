'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  isSyncing?: boolean;
  className?: string;
}

/**
 * Component to display real-time connection status - minimal dot indicator
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = React.memo(({
  isConnected,
  isReconnecting,
  isSyncing = false,
  className = '',
}) => {
  // Reconnecting - yellow spinner
  if (isReconnecting) {
    return (
      <div className={`relative group ${className}`}>
        <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Reconnexion...
        </div>
      </div>
    );
  }

  // Disconnected - red dot
  if (!isConnected) {
    return (
      <div className={`relative group ${className}`}>
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Déconnecté
        </div>
      </div>
    );
  }

  // Syncing - blue spinner
  if (isSyncing) {
    return (
      <div className={`relative group ${className}`}>
        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Synchronisation...
        </div>
      </div>
    );
  }

  // Connected - green dot
  return (
    <div className={`relative group ${className}`}>
      <div className="w-3 h-3 bg-green-500 rounded-full" />
      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        Connecté
      </div>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';
