import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;

export interface WebSocketConfig {
  url: string;
  token: string;
  onConnectionChange?: (connected: boolean) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

/**
 * Initialize WebSocket connection with JWT authentication
 */
export const initializeWebSocket = (config: WebSocketConfig): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(config.url, {
    auth: {
      token: config.token,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10, // Increased from 5
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('[WebSocket] Connected:', socket?.id);
    reconnectAttempts = 0;
    config.onConnectionChange?.(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('[WebSocket] Disconnected:', reason);
    config.onConnectionChange?.(false);
  });

  socket.on('connect_error', (error) => {
    console.error('[WebSocket] Connection error:', error.message);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    reconnectAttempts = attemptNumber;
    console.log('[WebSocket] Reconnection attempt:', attemptNumber);
    config.onReconnecting?.(attemptNumber);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
    reconnectAttempts = 0;
    config.onConnectionChange?.(true);
  });

  socket.on('reconnect_error', (error) => {
    console.error('[WebSocket] Reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('[WebSocket] Reconnection failed after all attempts');
    config.onReconnectFailed?.();
  });

  return socket;
};

/**
 * Get current WebSocket instance
 */
export const getWebSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if WebSocket is connected
 */
export const isWebSocketConnected = (): boolean => {
  return socket?.connected || false;
};
