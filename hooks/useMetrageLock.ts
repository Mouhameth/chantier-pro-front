import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type { MetrageLock } from '@/types/collaboration';

interface UseMetrageLockOptions {
  socket: Socket | null;
  sessionId: number | null;
  enabled?: boolean;
  onLockFailed?: (metrageId: number, lockedBy: number, lockedByName?: string) => void;
}

/**
 * Hook to manage metrage locks in real-time
 */
export const useMetrageLock = (options: UseMetrageLockOptions) => {
  const { socket, sessionId, enabled = true, onLockFailed } = options;

  const [lockedMetrages, setLockedMetrages] = useState<Map<number, MetrageLock>>(new Map());

  // Listen to lock events
  useEffect(() => {
    if (!enabled || !socket || !sessionId) {
      return;
    }

    // Metrage locked by someone
    const handleMetrageLocked = (data: { metrageId: number; lockedBy: number; lockedByName?: string }) => {
      console.log('[useMetrageLock] Metrage locked:', data);
      setLockedMetrages((prev) => {
        const newLocks = new Map(prev);
        newLocks.set(data.metrageId, {
          metrageId: data.metrageId,
          lockedBy: data.lockedBy,
          lockedByName: data.lockedByName,
          lockedAt: new Date().toISOString(),
        });
        return newLocks;
      });
    };

    // Metrage unlocked
    const handleMetrageUnlocked = (data: { metrageId: number }) => {
      console.log('[useMetrageLock] Metrage unlocked:', data);
      setLockedMetrages((prev) => {
        const newLocks = new Map(prev);
        newLocks.delete(data.metrageId);
        return newLocks;
      });
    };

    // Lock failed (already locked by someone else)
    const handleLockFailed = (data: { metrageId: number; lockedBy: number; lockedByName?: string; message?: string }) => {
      console.warn('[useMetrageLock] Lock failed:', data);
      onLockFailed?.(data.metrageId, data.lockedBy, data.lockedByName);
    };

    socket.on('metrage:locked', handleMetrageLocked);
    socket.on('metrage:unlocked', handleMetrageUnlocked);
    socket.on('metrage:lock:failed', handleLockFailed);

    return () => {
      socket.off('metrage:locked', handleMetrageLocked);
      socket.off('metrage:unlocked', handleMetrageUnlocked);
      socket.off('metrage:lock:failed', handleLockFailed);
    };
  }, [socket, sessionId, enabled, onLockFailed]);

  // Lock a metrage
  const lockMetrage = useCallback((metrageId: number) => {
    if (!socket?.connected || !sessionId) {
      console.warn('[useMetrageLock] Cannot lock: socket not connected or no session');
      return false;
    }

    console.log('[useMetrageLock] Requesting lock for metrage:', metrageId);
    socket.emit('metrage:lock', { sessionId, metrageId });
    return true;
  }, [socket, sessionId]);

  // Unlock a metrage
  const unlockMetrage = useCallback((metrageId: number) => {
    if (!socket?.connected || !sessionId) {
      console.warn('[useMetrageLock] Cannot unlock: socket not connected or no session');
      return false;
    }

    console.log('[useMetrageLock] Requesting unlock for metrage:', metrageId);
    socket.emit('metrage:unlock', { sessionId, metrageId });
    return true;
  }, [socket, sessionId]);

  // Check if a metrage is locked
  const isMetrageLocked = useCallback((metrageId: number): boolean => {
    return lockedMetrages.has(metrageId);
  }, [lockedMetrages]);

  // Check if a metrage is locked by current user
  const isMetrageLockedByMe = useCallback((metrageId: number, myUserId: number): boolean => {
    const lock = lockedMetrages.get(metrageId);
    return lock ? lock.lockedBy === myUserId : false;
  }, [lockedMetrages]);

  // Get lock info
  const getLockInfo = useCallback((metrageId: number): MetrageLock | null => {
    return lockedMetrages.get(metrageId) || null;
  }, [lockedMetrages]);

  return {
    lockedMetrages: Array.from(lockedMetrages.values()),
    lockMetrage,
    unlockMetrage,
    isMetrageLocked,
    isMetrageLockedByMe,
    getLockInfo,
  };
};
