import { useState, useEffect, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import type { Participant } from './useCollaborativeSession';

interface UsePageParticipantsOptions {
  socket: Socket | null;
  currentPageId: number;
  enabled?: boolean;
}

/**
 * Hook to track participants and calculate how many are on the same page
 * v2.1.0: Optimized for cursor sending - only send if others are on the same page
 */
export function usePageParticipants(options: UsePageParticipantsOptions) {
  const { socket, currentPageId, enabled = true } = options;

  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);

  // Calculate how many participants are on the same page (online only)
  const pageParticipantsCount = useMemo(() => {
    if (!enabled) return 1;

    const count = allParticipants.filter(p =>
      p.currentPageId === currentPageId && p.isOnline
    ).length;

    return count;
  }, [allParticipants, currentPageId, enabled]);

  // Helper to determine if cursor events should be sent
  const shouldSendCursor = useMemo(() => {
    return pageParticipantsCount > 1;
  }, [pageParticipantsCount]);

  // Listen to WebSocket events to update participants list
  useEffect(() => {
    if (!enabled || !socket) {
      return;
    }

    const updateParticipants = (participants: Participant[]) => {
      if (Array.isArray(participants)) {
        setAllParticipants(participants);
      }
    };

    // Initial session join
    const handleSessionJoined = (data: { participants: Participant[] }) => {
      console.log('[usePageParticipants] Session joined, participants:', data.participants);
      updateParticipants(data.participants);
    };

    // New user joined
    const handleUserJoined = (data: { allParticipants: Participant[] }) => {
      console.log('[usePageParticipants] User joined, updating participants');
      if (data.allParticipants) {
        updateParticipants(data.allParticipants);
      }
    };

    // User left
    const handleUserLeft = (data: { allParticipants: Participant[] }) => {
      console.log('[usePageParticipants] User left, updating participants');
      if (data.allParticipants) {
        updateParticipants(data.allParticipants);
      }
    };

    // User changed page (v2.1.0)
    const handleUserPageChanged = (data: { allParticipants: Participant[] }) => {
      console.log('[usePageParticipants] User changed page, updating participants');
      if (data.allParticipants) {
        updateParticipants(data.allParticipants);
      }
    };

    // User status changed (online/offline)
    const handleUserStatus = (data: { allParticipants: Participant[] }) => {
      console.log('[usePageParticipants] User status changed, updating participants');
      if (data.allParticipants) {
        updateParticipants(data.allParticipants);
      }
    };

    // Attach listeners
    socket.on('session:joined', handleSessionJoined);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('user:page-changed', handleUserPageChanged);
    socket.on('user:status', handleUserStatus);

    // Cleanup
    return () => {
      socket.off('session:joined', handleSessionJoined);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('user:page-changed', handleUserPageChanged);
      socket.off('user:status', handleUserStatus);
    };
  }, [socket, enabled]);

  // Debug log when count changes
  useEffect(() => {
    console.log(`[usePageParticipants] Page ${currentPageId} has ${pageParticipantsCount} participant(s)`);
    console.log(`[usePageParticipants] Should send cursor: ${shouldSendCursor}`);
  }, [pageParticipantsCount, currentPageId, shouldSendCursor]);

  return {
    allParticipants,
    pageParticipantsCount,
    shouldSendCursor,
  };
}
