import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { metrageApi } from '@/lib/api/metrage';
import { showToast } from '@/lib/utils/toast';
import type { Measurement, CreateMeasurementData } from '@/types/metrage';

interface UseMetrageSyncOptions {
  socket: Socket | null;
  sessionId: number | null;
  pageId: number;
  enabled?: boolean;
  onMetrageCreated?: (metrage: Measurement, createdBy: number) => void;
  onMetrageUpdated?: (metrageId: number, changes: any, updatedBy: number) => void;
  onMetrageDeleted?: (metrageId: number, deletedBy: number) => void;
}

/**
 * Hook to synchronize metrage CRUD operations in real-time
 */
export const useMetrageSync = (options: UseMetrageSyncOptions) => {
  const {
    socket,
    sessionId,
    pageId,
    enabled = true,
    onMetrageCreated,
    onMetrageUpdated,
    onMetrageDeleted,
  } = options;

  const [isSyncing, setIsSyncing] = useState(false);

  // Listen to sync events from other users
  useEffect(() => {
    if (!enabled || !socket || !sessionId) {
      return;
    }

    // Another user created a metrage
    const handleMetrageCreated = (data: { metrage: Measurement; createdBy: number }) => {
      console.log('[useMetrageSync] Metrage created by another user:', data);
      onMetrageCreated?.(data.metrage, data.createdBy);
    };

    // Another user updated a metrage
    const handleMetrageUpdated = (data: { metrageId: number; changes: any; updatedBy: number }) => {
      console.log('[useMetrageSync] Metrage updated by another user:', data);
      onMetrageUpdated?.(data.metrageId, data.changes, data.updatedBy);
    };

    // Another user deleted a metrage
    const handleMetrageDeleted = (data: { metrageId: number; deletedBy: number }) => {
      console.log('[useMetrageSync] Metrage deleted by another user:', data);
      onMetrageDeleted?.(data.metrageId, data.deletedBy);
    };

    socket.on('metrage:created', handleMetrageCreated);
    socket.on('metrage:updated', handleMetrageUpdated);
    socket.on('metrage:deleted', handleMetrageDeleted);

    return () => {
      socket.off('metrage:created', handleMetrageCreated);
      socket.off('metrage:updated', handleMetrageUpdated);
      socket.off('metrage:deleted', handleMetrageDeleted);
    };
  }, [socket, sessionId, enabled, onMetrageCreated, onMetrageUpdated, onMetrageDeleted]);

  // Create a metrage (REST API + WebSocket broadcast)
  const createMetrage = useCallback(async (data: CreateMeasurementData): Promise<Measurement | null> => {
    if (!sessionId) {
      showToast.error('Aucune session de collaboration active');
      return null;
    }

    try {
      setIsSyncing(true);
      console.log('[useMetrageSync] Creating metrage via API...');

      // 1. Create via REST API
      const measurement = await metrageApi.createMeasurement(pageId, data);

      // 2. Broadcast via WebSocket (v2.1.0: avec pageId maintenant)
      if (socket?.connected) {
        socket.emit('metrage:created', {
          sessionId,
          pageId, // ← v2.1.0: obligatoire pour room filtering
          metrage: measurement,
        });
        console.log('[useMetrageSync] Metrage created and broadcasted');
      }

      return measurement;
    } catch (error: any) {
      console.error('[useMetrageSync] Failed to create metrage:', error);
      showToast.error(error.message || 'Erreur lors de la création du métrage');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [socket, sessionId, pageId]);

  // Update a metrage (REST API + WebSocket broadcast)
  const updateMetrage = useCallback(async (metrageId: number, changes: any): Promise<boolean> => {
    if (!sessionId) {
      showToast.error('Aucune session de collaboration active');
      return false;
    }

    try {
      setIsSyncing(true);
      console.log('[useMetrageSync] Updating metrage via API...', metrageId);

      // 1. Update via REST API
      await metrageApi.updateMeasurement(metrageId, changes);

      // 2. Broadcast via WebSocket (v2.1.0: avec pageId maintenant)
      if (socket?.connected) {
        socket.emit('metrage:updated', {
          sessionId,
          pageId, // ← v2.1.0: obligatoire pour room filtering
          metrageId,
          changes,
        });
        console.log('[useMetrageSync] Metrage updated and broadcasted');
      }

      return true;
    } catch (error: any) {
      console.error('[useMetrageSync] Failed to update metrage:', error);
      showToast.error(error.message || 'Erreur lors de la mise à jour du métrage');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [socket, sessionId, pageId]);

  // Delete a metrage (REST API + WebSocket broadcast)
  const deleteMetrage = useCallback(async (metrageId: number): Promise<boolean> => {
    if (!sessionId) {
      showToast.error('Aucune session de collaboration active');
      return false;
    }

    try {
      setIsSyncing(true);
      console.log('[useMetrageSync] Deleting metrage via API...', metrageId);

      // 1. Delete via REST API
      await metrageApi.deleteMeasurement(metrageId);

      // 2. Broadcast via WebSocket (v2.1.0: avec pageId maintenant)
      if (socket?.connected) {
        socket.emit('metrage:deleted', {
          sessionId,
          pageId, // ← v2.1.0: obligatoire pour room filtering
          metrageId,
        });
        console.log('[useMetrageSync] Metrage deleted and broadcasted');
      }

      return true;
    } catch (error: any) {
      console.error('[useMetrageSync] Failed to delete metrage:', error);
      showToast.error(error.message || 'Erreur lors de la suppression du métrage');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [socket, sessionId, pageId]);

  return {
    createMetrage,
    updateMetrage,
    deleteMetrage,
    isSyncing,
  };
};
