import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { initializeWebSocket, getWebSocket, disconnectWebSocket } from '@/lib/services/websocket';
import { showToast } from '@/lib/utils/toast';

export interface Participant {
  userId: number;
  firstname: string;
  lastname: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER' | 'VALIDATOR';
  isOnline: boolean;
  joinedAt: string;
  currentPageId: number | null; // ← v2.1.0: Tracking de la page courante
}

export interface CursorPosition {
  userId: number;
  firstname: string;
  lastname: string;
  x: number;
  y: number;
  color?: string;
}

interface UseCollaborativeSessionOptions {
  sessionId: number | null;
  pageId?: number; // ← v2.1.0: Page courante pour les événements
  enabled?: boolean;
  onUserJoined?: (userId: number) => void;
  onUserLeft?: (userId: number) => void;
  onUserPageChanged?: (userId: number, pageId: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to manage WebSocket connection and real-time presence
 */
export const useCollaborativeSession = (options: UseCollaborativeSessionOptions) => {
  const { sessionId, pageId, enabled = true, onUserJoined, onUserLeft, onUserPageChanged, onError } = options;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cursors, setCursors] = useState<Map<number, CursorPosition>>(new Map());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef(sessionId);
  const pageIdRef = useRef(pageId);
  const reconnectToastIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onUserJoined, onUserLeft, onUserPageChanged, onError });
  const participantsRef = useRef<Participant[]>([]);
  const participantsMapRef = useRef<Map<number, Participant>>(new Map());
  const listenersRef = useRef<{
    handleConnect?: () => void;
    handleDisconnect?: () => void;
    handleConnectError?: (error: Error) => void;
    handleSessionJoined?: (data: any) => void;
    handleUserJoined?: (data: any) => void;
    handleUserLeft?: (data: any) => void;
    handleUserStatus?: (data: any) => void;
    handleCursorUpdated?: (data: any) => void;
    handlePageChanged?: (data: any) => void; // ← v2.1.0
    handleUserPageChanged?: (data: any) => void; // ← v2.1.0
  }>({});
  const lastUserJoinedRef = useRef<{ userId: number; timestamp: number } | null>(null);

  // Update refs without causing re-renders + build participant map for fast lookup
  useEffect(() => {
    sessionIdRef.current = sessionId;
    pageIdRef.current = pageId;
    callbacksRef.current = { onUserJoined, onUserLeft, onUserPageChanged, onError };
    participantsRef.current = participants;

    // Build fast lookup map: O(1) instead of O(n)
    const map = new Map<number, Participant>();
    participants.forEach(p => map.set(p.userId, p));
    participantsMapRef.current = map;
  }, [sessionId, pageId, onUserJoined, onUserLeft, onUserPageChanged, onError, participants]);

  // Debug: Log participants changes
  useEffect(() => {
    console.log('👥 ========================================');
    console.log('👥 [useCollaborativeSession] PARTICIPANTS STATE CHANGED!');
    console.log('👥 Number of participants:', participants.length);
    console.log('👥 Participants array:', participants);

    if (participants.length === 0) {
      console.log('👥 ⚠️ NO PARTICIPANTS IN STATE!');
    } else {
      participants.forEach((p, index) => {
        console.log(`👥 Participant ${index + 1}:`, {
          userId: p.userId,
          firstname: p.firstname,
          lastname: p.lastname,
          role: p.role,
          email: p.email,
          isOnline: p.isOnline ? '🟢' : '⚫',
        });
      });
    }
    console.log('👥 ========================================');
  }, [participants]);

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('[useCollaborativeSession] useEffect triggered', { enabled, sessionId });

    if (!enabled || !sessionId) {
      return;
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('[useCollaborativeSession] No authentication token found - skipping WebSocket connection');
      return;
    }

    // Save previous handlers before overwriting, so cleanup can remove them
    const prevListeners = { ...listenersRef.current };

    // Event handler functions (stored in ref for cleanup)
    listenersRef.current.handleConnect = () => {
      console.log('[useCollaborativeSession] Connected to WebSocket');
      setIsConnected(true);
      // Join session
      if (sessionIdRef.current) {
        const ws = getWebSocket();
        ws?.emit('join:session', { sessionId: sessionIdRef.current });
      }
    };

    listenersRef.current.handleDisconnect = () => {
      console.log('[useCollaborativeSession] Disconnected from WebSocket');
      setIsConnected(false);
    };

    listenersRef.current.handleConnectError = (error: Error) => {
      console.error('[useCollaborativeSession] Connection error:', error);
      callbacksRef.current.onError?.(error);
    };

    listenersRef.current.handleSessionJoined = (data: any) => {
      console.log('🎉 [useCollaborativeSession] Session joined EVENT RECEIVED:', data);
      console.log('🎉 [useCollaborativeSession] Full data object:', JSON.stringify(data, null, 2));

      const sessionParticipants = data.participants;
      console.log('🎉 [useCollaborativeSession] Extracted participants:', sessionParticipants);
      console.log('🎉 [useCollaborativeSession] Participants type:', typeof sessionParticipants, 'isArray:', Array.isArray(sessionParticipants));

      // Check if backend is sending wrong format (number instead of array)
      if (typeof sessionParticipants === 'number') {
        console.error('❌ ========================================');
        console.error('❌ BACKEND ERROR: participants est un nombre, pas un tableau!');
        console.error('❌ Reçu:', sessionParticipants);
        console.error('❌ Attendu: [{ userId, firstname, lastname, email, role, ... }, ...]');
        console.error('❌ Voir: BACKEND_COLLABORATION_FIX.md');
        console.error('❌ ========================================');
      }

      // Ensure we always set an array
      const participantsArray = Array.isArray(sessionParticipants) ? sessionParticipants : [];
      console.log('🎉 [useCollaborativeSession] Setting participants array with length:', participantsArray.length);
      console.log('🎉 [useCollaborativeSession] Participants array content:', participantsArray);

      setParticipants(participantsArray);
    };

    listenersRef.current.handleUserJoined = (data: any) => {
      console.log('[useCollaborativeSession] User joined event:', data);

      const { userId, firstname, lastname, email, role, isOnline, joinedAt, allParticipants } = data;

      callbacksRef.current.onUserJoined?.(userId);

      // Toast notification like MS Teams / Google Meet
      if (firstname || lastname) {
        showToast.userJoined(firstname || '', lastname || '', userId);
      } else {
        // Try to find name from participants map
        const participant = participantsMapRef.current.get(userId);
        if (participant) {
          showToast.userJoined(participant.firstname, participant.lastname, userId);
        }
      }

      // Si le backend envoie la liste complète mise à jour, l'utiliser
      if (allParticipants && Array.isArray(allParticipants)) {
        console.log('[useCollaborativeSession] ✅ Received updated participants list:', allParticipants);
        setParticipants(allParticipants);
      } else {
        // Sinon, ajouter manuellement le nouveau participant
        console.log('[useCollaborativeSession] ⚠️ No allParticipants in user:joined event');
        console.log('[useCollaborativeSession] ⚠️ Voir BACKEND_COLLABORATION_FIX.md pour corriger');

        if (firstname && lastname) {
          // Ajouter le participant manuellement si on a les infos
          setParticipants((prev) => {
            const prevArray = Array.isArray(prev) ? prev : [];
            // Éviter les doublons
            if (prevArray.some(p => p.userId === userId)) {
              return prevArray;
            }
            return [...prevArray, {
              userId,
              firstname,
              lastname,
              email,
              role: role || 'VIEWER',
              isOnline: isOnline !== undefined ? isOnline : true,
              joinedAt: joinedAt || new Date().toISOString(),
            }];
          });
        }
      }
    };

    listenersRef.current.handleUserLeft = (data: any) => {
      console.log('[useCollaborativeSession] User left event:', data);

      const { userId, allParticipants } = data;

      // Toast notification - find name from participants before removing
      const participant = participantsMapRef.current.get(userId);
      if (participant) {
        showToast.userLeft(participant.firstname, participant.lastname, userId);
      }

      // Si le backend envoie la liste complète mise à jour, l'utiliser
      if (allParticipants && Array.isArray(allParticipants)) {
        console.log('[useCollaborativeSession] ✅ Received updated participants list after user left');
        setParticipants(allParticipants);
      } else {
        // Sinon, retirer manuellement le participant
        setParticipants((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter((p) => p.userId !== userId);
        });
      }

      // Retirer le curseur de l'utilisateur
      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });

      callbacksRef.current.onUserLeft?.(userId);
    };

    listenersRef.current.handleUserStatus = (data: any) => {
      console.log('[useCollaborativeSession] User status changed:', data);

      const { userId, isOnline, allParticipants } = data;

      // Si le backend envoie la liste complète mise à jour, l'utiliser
      if (allParticipants && Array.isArray(allParticipants)) {
        console.log('[useCollaborativeSession] ✅ Received updated participants list with new status');
        setParticipants(allParticipants);
      } else {
        // Sinon, mettre à jour manuellement le statut
        setParticipants((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map((p) =>
            p.userId === userId ? { ...p, isOnline } : p
          );
        });
      }

      // Si l'utilisateur est déconnecté, retirer son curseur
      if (!isOnline) {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.delete(userId);
          return newCursors;
        });
      }
    };

    listenersRef.current.handleCursorUpdated = ({ userId, firstname, lastname, x, y }: any) => {
      // Si le backend n'envoie pas firstname/lastname, chercher dans le Map (O(1))
      let finalFirstname = firstname;
      let finalLastname = lastname;

      if (!firstname || !lastname) {
        const participant = participantsMapRef.current.get(userId);
        if (participant) {
          finalFirstname = participant.firstname;
          finalLastname = participant.lastname;
        }
      }

      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(userId, {
          userId,
          firstname: finalFirstname || 'Unknown',
          lastname: finalLastname || 'User',
          x,
          y,
          color: generateUserColor(userId),
        });
        return newCursors;
      });
    };

    // v2.1.0: Confirmation de changement de page
    listenersRef.current.handlePageChanged = ({ pageId }: any) => {
      console.log('[useCollaborativeSession] ✅ Page changed confirmed:', pageId);
      pageIdRef.current = pageId;
    };

    // v2.1.0: Un participant a changé de page
    listenersRef.current.handleUserPageChanged = ({ userId, pageId, allParticipants }: any) => {
      console.log('[useCollaborativeSession] User changed page:', { userId, pageId });

      // Mettre à jour la liste complète des participants
      if (allParticipants && Array.isArray(allParticipants)) {
        setParticipants(allParticipants);
      }

      // Callback optionnel
      callbacksRef.current.onUserPageChanged?.(userId, pageId);

      // Toast notification
      const participant = participantsMapRef.current.get(userId);
      if (participant) {
        showToast.info(`${participant.firstname} est passé sur la page ${pageId}`);
      }
    };

    // Helper function to setup event listeners
    // Remove previous listeners (if any) then attach new ones
    const setupSocketListeners = (ws: Socket) => {
      if (!listenersRef.current.handleConnect) return;

      // Remove PREVIOUS handlers (saved before overwrite) to prevent duplicates
      if (prevListeners.handleConnect) ws.off('connect', prevListeners.handleConnect);
      if (prevListeners.handleDisconnect) ws.off('disconnect', prevListeners.handleDisconnect);
      if (prevListeners.handleConnectError) ws.off('connect_error', prevListeners.handleConnectError);
      if (prevListeners.handleSessionJoined) ws.off('session:joined', prevListeners.handleSessionJoined);
      if (prevListeners.handleUserJoined) ws.off('user:joined', prevListeners.handleUserJoined);
      if (prevListeners.handleUserLeft) ws.off('user:left', prevListeners.handleUserLeft);
      if (prevListeners.handleUserStatus) ws.off('user:status', prevListeners.handleUserStatus);
      if (prevListeners.handleCursorUpdated) ws.off('cursor:updated', prevListeners.handleCursorUpdated);
      if (prevListeners.handlePageChanged) ws.off('page:changed:success', prevListeners.handlePageChanged);
      if (prevListeners.handleUserPageChanged) ws.off('user:page-changed', prevListeners.handleUserPageChanged);

      // Attach new listeners
      ws.on('connect', listenersRef.current.handleConnect);
      ws.on('disconnect', listenersRef.current.handleDisconnect!);
      ws.on('connect_error', listenersRef.current.handleConnectError!);
      ws.on('session:joined', listenersRef.current.handleSessionJoined!);
      ws.on('user:joined', listenersRef.current.handleUserJoined!);
      ws.on('user:left', listenersRef.current.handleUserLeft!);
      ws.on('user:status', listenersRef.current.handleUserStatus!);
      ws.on('cursor:updated', listenersRef.current.handleCursorUpdated!);
      ws.on('page:changed:success', listenersRef.current.handlePageChanged!);
      ws.on('user:page-changed', listenersRef.current.handleUserPageChanged!);
    };

    try {

      // Check if socket already exists and is connected
      const existingSocket = getWebSocket();
      if (existingSocket?.connected) {
        console.log('[useCollaborativeSession] Reusing existing connected socket');
        setSocket(existingSocket);
        setIsConnected(true);

        // Setup listeners for this component instance
        setupSocketListeners(existingSocket);

        // Join the new session
        existingSocket.emit('join:session', { sessionId });

        // Start heartbeat for this session
        heartbeatIntervalRef.current = setInterval(() => {
          if (existingSocket.connected && sessionIdRef.current) {
            existingSocket.emit('heartbeat', { sessionId: sessionIdRef.current });
          }
        }, 15000);

        return;
      }

      // Initialize new WebSocket with reconnection callbacks
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const ws = initializeWebSocket({
        url: wsUrl,
        token,
        onConnectionChange: (connected) => {
          setIsConnected(connected);
          if (connected) {
            setIsReconnecting(false);
            if (reconnectToastIdRef.current) {
              showToast.success('Reconnecté au serveur de collaboration');
              reconnectToastIdRef.current = null;
            }
          }
        },
        onReconnecting: (attempt) => {
          setIsReconnecting(true);
          if (attempt === 1) {
            showToast.warning('Connexion perdue, reconnexion en cours...');
          }
        },
        onReconnectFailed: () => {
          setIsReconnecting(false);
          showToast.error('Impossible de se reconnecter au serveur. Veuillez recharger la page.');
        },
      });
      setSocket(ws);

      // Setup event listeners
      setupSocketListeners(ws);

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.connected && sessionIdRef.current) {
          ws.emit('heartbeat', { sessionId: sessionIdRef.current });
        }
      }, 15000); // 15 seconds

    } catch (error) {
      console.error('[useCollaborativeSession] Setup error:', error);
      callbacksRef.current.onError?.(error as Error);
    }

    // Cleanup
    return () => {
      console.log('[useCollaborativeSession] Cleanup triggered');
      const ws = getWebSocket();
      if (ws) {
        // Leave session if we have a sessionId
        if (sessionIdRef.current) {
          console.log('[useCollaborativeSession] Leaving session:', sessionIdRef.current);
          ws.emit('leave:session', { sessionId: sessionIdRef.current });
        }

        // Remove event listeners using stored handlers
        if (listenersRef.current.handleConnect) {
          ws.off('connect', listenersRef.current.handleConnect);
        }
        if (listenersRef.current.handleDisconnect) {
          ws.off('disconnect', listenersRef.current.handleDisconnect);
        }
        if (listenersRef.current.handleConnectError) {
          ws.off('connect_error', listenersRef.current.handleConnectError);
        }
        if (listenersRef.current.handleSessionJoined) {
          ws.off('session:joined', listenersRef.current.handleSessionJoined);
        }
        if (listenersRef.current.handleUserJoined) {
          ws.off('user:joined', listenersRef.current.handleUserJoined);
        }
        if (listenersRef.current.handleUserLeft) {
          ws.off('user:left', listenersRef.current.handleUserLeft);
        }
        if (listenersRef.current.handleUserStatus) {
          ws.off('user:status', listenersRef.current.handleUserStatus);
        }
        if (listenersRef.current.handleCursorUpdated) {
          ws.off('cursor:updated', listenersRef.current.handleCursorUpdated);
        }
        if (listenersRef.current.handlePageChanged) {
          ws.off('page:changed:success', listenersRef.current.handlePageChanged);
        }
        if (listenersRef.current.handleUserPageChanged) {
          ws.off('user:page-changed', listenersRef.current.handleUserPageChanged);
        }
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // DON'T reset participants/cursors here - they should persist
      // Only reset socket connection state
      setSocket(null);
      setIsConnected(false);

      // Clear listeners ref
      listenersRef.current = {};
    };
  }, [sessionId, enabled]);

  // Send cursor position (v2.1.0: avec pageId maintenant)
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (socket?.connected && sessionId && pageIdRef.current) {
      socket.emit('cursor:move', {
        sessionId,
        pageId: pageIdRef.current,
        x,
        y
      });
    }
  }, [socket, sessionId]);

  // v2.1.0: Notifier le serveur qu'on a changé de page
  const sendPageChange = useCallback((newPageId: number) => {
    if (socket?.connected && sessionId) {
      console.log('[useCollaborativeSession] Sending page:changed event:', newPageId);
      socket.emit('page:changed', { sessionId, pageId: newPageId });
      pageIdRef.current = newPageId;
    }
  }, [socket, sessionId]);

  return {
    participants,
    cursors: Array.from(cursors.values()),
    socket,
    isConnected,
    isReconnecting,
    sendCursorPosition,
    sendPageChange, // ← v2.1.0
  };
};

/**
 * Generate a consistent color for a user based on their ID
 */
function generateUserColor(userId: number): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];
  return colors[userId % colors.length];
}
