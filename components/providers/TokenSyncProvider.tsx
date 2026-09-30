'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api/client';

/**
 * Component that automatically syncs NextAuth session tokens to localStorage
 * for use by the API client. This should be rendered once in the app layout.
 */
export function TokenSyncProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.accessToken && session?.refreshToken) {
      // Sync tokens from NextAuth session to localStorage
      apiClient.setTokens(session.accessToken, session.refreshToken);
    } else {
      // Clear tokens if session is invalid
      apiClient.clearTokens();
    }
  }, [session]);

  // This component doesn't render anything
  return null;
}
