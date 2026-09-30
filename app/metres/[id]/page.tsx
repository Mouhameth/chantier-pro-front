'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { blueprintsApi } from '@/lib/api/blueprints';
import { metrageApi } from '@/lib/api/metrage';
import { showToast } from '@/lib/utils/toast';
import dynamic from 'next/dynamic';
import type { MetrageCanvasHandle } from '@/components/metrage/MetrageCanvas';
import CalibrationSuggestionModal from '@/components/metrage/CalibrationSuggestionModal';
import OuvrageManagementModal from '@/components/ouvrage/OuvrageManagementModal';
import MeasurementDetailsModal from '@/components/metrage/MeasurementDetailsModal';
import CreateMeasurementModal from '@/components/metrage/CreateMeasurementModal';
import type { Measurement, CreateMeasurementData, MeasurementGeometry } from '@/types/metrage';
import { MetrageType } from '@/types/metrage';
import { calculateMeasurementQuantity } from '@/lib/utils/measurement-helpers';
import { useAutoSession } from '@/hooks/useAutoSession';
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';
import { useMetrageLock } from '@/hooks/useMetrageLock';
import { useMetrageSync } from '@/hooks/useMetrageSync';
import { usePageParticipants } from '@/hooks/usePageParticipants';
import { ParticipantsList } from '@/components/collaboration/ParticipantsList';
import { InviteButton } from '@/components/collaboration/InviteButton';
import { CollaborativeCursors, useThrottledCursor } from '@/components/collaboration/CollaborativeCursors';
import { ConnectionStatus } from '@/components/collaboration/ConnectionStatus';
import { useAuth } from '@/hooks/useAuth';
import { AIAssistantPanel } from '@/components/ai';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';

// Dynamically import the canvas component to avoid SSR issues
const MetrageCanvas = dynamic(() => import('@/components/metrage/MetrageCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  ),
});
import {
  ArrowLeft,
  MousePointer2,
  Ruler,
  Square,
  Pentagon,
  Gauge,
  Waves,
  Hash,
  Box,
  Scale,
  Undo2,
  Redo2,
  Settings,
  FileText,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoreVertical,
  Check,
  CheckCheck,
  RotateCcw,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { PageStatus } from '@/types/blueprint';
import React from 'react';

type ToolType = 'select' | 'distance' | 'surface' | 'polygon' | 'angle' | 'curve' | 'count' | 'volume' | 'calibrate';
type FilterType = 'all' | 'pending' | 'complete';
type RightTab = 'measures' | 'ai';

const statusConfig: Record<PageStatus, { label: string; color: string; icon: string }> = {
  [PageStatus.PENDING]: { label: 'Aucun métrage', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⏸️' },
  [PageStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🔄' },
  [PageStatus.COMPLETED]: { label: 'Terminé', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✅' },
  [PageStatus.VALIDATED]: { label: 'Validé', color: 'bg-green-100 text-green-700 border-green-200', icon: '✔️' },
};

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Sélection', shortcut: 'V' },
  { id: 'distance', icon: Ruler, label: 'Distance (ml)', shortcut: 'D' },
  { id: 'surface', icon: Square, label: 'Surface (m²)', shortcut: 'S' },
  { id: 'polygon', icon: Pentagon, label: 'Polygone', shortcut: 'P' },
  { id: 'angle', icon: Gauge, label: 'Angle', shortcut: 'A' },
  { id: 'curve', icon: Waves, label: 'Courbe', shortcut: 'C' },
  { id: 'count', icon: Hash, label: 'Comptage', shortcut: 'N' },
  { id: 'volume', icon: Box, label: 'Volume (m³)', shortcut: 'B' },
  { id: 'calibrate', icon: Scale, label: 'Calibrage / Échelle', shortcut: 'K' },
] as const;

export default function MetreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const blueprintId = Number(params.id);

  // UI State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>('measures');
  const [showLeftContent, setShowLeftContent] = useState(true);
  const [showRightContent, setShowRightContent] = useState(true);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageFilter, setPageFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [measurementSearchQuery, setMeasurementSearchQuery] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [blueprintTitle, setBlueprintTitle] = useState('');
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isOuvrageModalOpen, setIsOuvrageModalOpen] = useState(false);
  const [measurementsVisible, setMeasurementsVisible] = useState(true);

  // Save state tracking
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [pendingChanges, setPendingChanges] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Measurement State
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [expandedCountingGroups, setExpandedCountingGroups] = useState<string[]>([]); // Format: "categoryId-itemId"
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<number | null>(null);
  const [highlightedMeasurementId, setHighlightedMeasurementId] = useState<string | null>(null);
  const [highlightedMeasurementIds, setHighlightedMeasurementIds] = useState<string[]>([]); // For group highlighting
  const [highlightedCountingGroup, setHighlightedCountingGroup] = useState<string | null>(null); // Format: "categoryId-itemId"
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [blinkingMeasurementId, setBlinkingMeasurementId] = useState<number | null>(null);

  // Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingMeasurement, setPendingMeasurement] = useState<{
    type: MetrageType;
    geometry: MeasurementGeometry;
    color: string;
  } | null>(null);

  // Counting mode state
  const [isCountingModalOpen, setIsCountingModalOpen] = useState(false);
  const [countingItemData, setCountingItemData] = useState<{ categoryId: number; itemId: number; itemName: string; color: string } | null>(null);

  // Page status menu state
  const [openPageMenuId, setOpenPageMenuId] = useState<number | null>(null);
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);
  const [statusConfirmDialog, setStatusConfirmDialog] = useState<{
    isOpen: boolean;
    pageId: number;
    newStatus: PageStatus;
    pageName: string;
  } | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    pageId: number;
    pageName: string;
  } | null>(null);

  // Ref for canvas controls
  const canvasRef = useRef<MetrageCanvasHandle>(null);

  // Data fetching
  const { data: blueprint, isLoading, error } = useQuery({
    queryKey: ['blueprint', blueprintId],
    queryFn: () => blueprintsApi.getById(blueprintId),
    enabled: !!blueprintId,
  });

  // Fetch ouvrage categories to get colors
  const { data: ouvrageData } = useQuery({
    queryKey: ['ouvrage-categories'],
    queryFn: async () => {
      const { ouvrageApi } = await import('@/lib/api/ouvrage');
      return ouvrageApi.listCategories(true);
    },
  });

  const currentPage = blueprint?.pages?.[currentPageIndex];

  // Get authenticated user
  const { user } = useAuth();

  // Collaboration: Auto-session management
  const { session, isLoading: sessionLoading } = useAutoSession({
    pageId: currentPage?.id || 0,
    blueprintId: blueprint?.id || 0,
    pageName: currentPage?.title,
    enabled: !!currentPage?.id && !!blueprint?.id,
  });

  // Collaboration: WebSocket connection and presence
  const { participants, cursors, socket, isConnected, isReconnecting, sendCursorPosition, sendPageChange } = useCollaborativeSession({
    sessionId: session?.id || null,
    pageId: currentPage?.id, // v2.1.0: Current page for events
    enabled: !!session?.id,
    onUserJoined: (userId) => {
      console.log('[BlueprintPage] User joined:', userId);
    },
    onUserLeft: (userId) => {
      console.log('[BlueprintPage] User left:', userId);
    },
  });

  // Debug: Log participants from hook
  useEffect(() => {
    console.log('[BlueprintPage] Received participants from hook:', participants);
  }, [participants]);

  // v2.1.0: Track participants on current page (for cursor optimization)
  const { shouldSendCursor } = usePageParticipants({
    socket,
    currentPageId: currentPage?.id || 0,
    enabled: !!socket && !!session?.id,
  });

  // v2.1.0: Notify server when user changes page
  useEffect(() => {
    if (currentPage?.id && sendPageChange && session?.id) {
      console.log('[BlueprintPage] Page changed, notifying server:', currentPage.id);
      sendPageChange(currentPage.id);
    }
  }, [currentPage?.id, sendPageChange, session?.id]);

  // Collaboration: Metrage locking
  const { lockMetrage, unlockMetrage, isMetrageLocked, isMetrageLockedByMe, getLockInfo } = useMetrageLock({
    socket,
    sessionId: session?.id || null,
    enabled: !!session?.id,
    onLockFailed: (metrageId, lockedBy, lockedByName) => {
      showToast.error(`Ce métrage est déjà en cours d'édition par ${lockedByName || 'un autre utilisateur'}`);
    },
  });

  // Collaboration: Metrage CRUD synchronization
  const {
    createMetrage: createMetrageSync,
    updateMetrage: updateMetrageSync,
    deleteMetrage: deleteMetrageSync,
    isSyncing,
  } = useMetrageSync({
    socket,
    sessionId: session?.id || null,
    pageId: currentPage?.id || 0,
    enabled: !!session?.id,
    onMetrageCreated: (metrage, createdBy) => {
      console.log('[BlueprintPage] Metrage created by another user:', metrage.id);
      // Refetch measurements to show the new metrage
      queryClient.invalidateQueries({ queryKey: ['measurements', currentPage?.id] });
    },
    onMetrageUpdated: (metrageId, changes, updatedBy) => {
      console.log('[BlueprintPage] Metrage updated by another user:', metrageId);
      // Refetch measurements to show the updated metrage
      queryClient.invalidateQueries({ queryKey: ['measurements', currentPage?.id] });
    },
    onMetrageDeleted: (metrageId, deletedBy) => {
      console.log('[BlueprintPage] Metrage deleted by another user:', metrageId);
      // Refetch measurements to remove the deleted metrage
      queryClient.invalidateQueries({ queryKey: ['measurements', currentPage?.id] });
    },
  });

  // Get current user ID for collaboration features
  const currentUserId = user?.id ? Number(user.id) : undefined;

  // AI Assistant: Conversational only
  const {
    messages: aiMessages,
    isAnalyzing,
    sendInstruction,
    clearChat,
  } = useAIAnalysis({
    pageId: currentPage?.id || 0,
  });

  // Create page index map for O(1) lookup
  const pageIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    blueprint?.pages?.forEach((page, index) => {
      map.set(page.id, index);
    });
    return map;
  }, [blueprint?.pages]);

  // Filter pages based on search and filter
  const filteredPages = useMemo(() => {
    if (!blueprint?.pages) return [];

    return blueprint.pages.filter((page) => {
      // Filter by status
      if (pageFilter !== 'all') {
        const status = page.status || PageStatus.PENDING;
        const isCompleted = status === PageStatus.COMPLETED || status === PageStatus.VALIDATED;
        if (pageFilter === 'pending' && isCompleted) return false;
        if (pageFilter === 'complete' && !isCompleted) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = page.title?.toLowerCase() || '';
        const pageNum = `page ${page.pageNumber}`;
        return title.includes(query) || pageNum.includes(query);
      }

      return true;
    });
  }, [blueprint?.pages, pageFilter, searchQuery]);

  // Fetch measurements for current page
  const { data: measurementsData } = useQuery({
    queryKey: ['measurements', currentPage?.id],
    queryFn: () => metrageApi.listMeasurements(currentPage!.id),
    enabled: !!currentPage?.id && currentPage.isCalibrated,
  });

  const measurements = measurementsData?.data || [];

  // Filter measurements based on search query
  const filteredMeasurements = useMemo(() => {
    if (!measurementSearchQuery.trim()) return measurements;

    const query = measurementSearchQuery.toLowerCase();
    return measurements.filter((m) => {
      // Search in label
      if (m.label?.toLowerCase().includes(query)) return true;

      // Search in category title
      if (m.category?.title?.toLowerCase().includes(query)) return true;

      // Search in item title
      if (m.item?.title?.toLowerCase().includes(query)) return true;

      // Search in comment
      if (m.comment?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [measurements, measurementSearchQuery]);

  // Convert API measurements to canvas format
  const canvasMeasurements = React.useMemo(() => {
    return measurements.map((m) => {
      // Convert MetrageType to canvas display type
      let type: 'distance' | 'surface' | 'polygon' | 'volume' | 'count';
      switch (m.type) {
        case MetrageType.LINE:
          type = 'distance';
          break;
        case MetrageType.POLYLINE:
          type = 'distance'; // Curves/polylines displayed as distance type
          break;
        case MetrageType.POLYGON:
          type = 'surface';
          break;
        case MetrageType.VOLUME:
          type = 'volume';
          break;
        case MetrageType.POINT:
          type = 'count';
          break;
        default:
          type = 'distance';
      }

      // Extract points from geometry
      let points: { x: number; y: number }[];
      if (m.type === MetrageType.POINT) {
        const geo = m.geometry as any;
        // Handle both single point {x, y} and multiple points {points: [...]}
        if (geo.points && Array.isArray(geo.points)) {
          points = geo.points;
        } else {
          points = [{ x: geo.x, y: geo.y }];
        }
      } else {
        const geo = m.geometry as { points: { x: number; y: number }[] };
        points = geo.points;
      }

      const converted = {
        id: m.id.toString(),
        type,
        points,
        color: m.color,
        label: m.label || undefined,
        value: parseFloat(m.quantity),
        unit: m.unit,
      };
      return converted;
    });
  }, [measurements, currentPage?.id]);

  // Mutations
  const createMeasurementMutation = useMutation({
    mutationFn: async (data: CreateMeasurementData) => {
      // Use collaborative sync if session is active, otherwise fall back to direct API
      if (session && socket?.connected) {
        const result = await createMetrageSync(data);
        if (!result) throw new Error('Échec de la création du métrage');
        return result;
      }
      return metrageApi.createMeasurement(currentPage!.id, data);
    },
    onMutate: async (newMeasurement) => {
      setSaveState('saving');
      setPendingChanges(prev => prev + 1);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['measurements', currentPage?.id] });

      // Snapshot the previous value
      const previousMeasurements = queryClient.getQueryData(['measurements', currentPage?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['measurements', currentPage?.id], (old: any) => {
        if (!old) return old;

        // Calculate quantity immediately on client side
        const calculatedQuantity = calculateMeasurementQuantity(
          newMeasurement.type,
          newMeasurement.geometry,
          currentPage?.pixelsPerMeter ?? 1
        );

        // Create optimistic measurement with temporary unique ID
        const optimisticMeasurement = {
          id: -Date.now() - Math.random(), // Negative temporary ID to avoid conflicts
          ...newMeasurement,
          quantity: calculatedQuantity.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add category and item info from cache if available
          category: ouvrageData?.data?.find(cat => cat.id === newMeasurement.categoryId),
          item: ouvrageData?.data?.find(cat => cat.id === newMeasurement.categoryId)?.items?.find(item => item.id === newMeasurement.itemId),
        };

        return {
          ...old,
          data: [...(old.data || []), optimisticMeasurement],
        };
      });

      // Return context with previous data for rollback
      return { previousMeasurements };
    },
    onSuccess: () => {
      setPendingChanges(prev => prev - 1);
      queryClient.invalidateQueries({ queryKey: ['measurements', currentPage?.id] });
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
    },
    onError: (error: any, newMeasurement, context) => {
      setPendingChanges(prev => prev - 1);
      setSaveState('error');
      showToast.error(error.message || 'Erreur lors de la création');

      // Rollback to previous state on error
      if (context?.previousMeasurements) {
        queryClient.setQueryData(['measurements', currentPage?.id], context.previousMeasurements);
      }
    },
    onSettled: () => {
      setPendingChanges(prev => {
        if (prev <= 0) {
          setSaveState('saved');
        }
        return prev;
      });
    },
  });

  const updateMeasurementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      // Use collaborative sync if session is active, otherwise fall back to direct API
      if (session && socket?.connected) {
        const success = await updateMetrageSync(id, data);
        if (!success) throw new Error('Échec de la modification du métrage');
        return;
      }
      return metrageApi.updateMeasurement(id, data);
    },
    onMutate: async ({ id, data }) => {
      setSaveState('saving');
      setPendingChanges(prev => prev + 1);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['measurements', currentPage?.id] });

      // Snapshot the previous value
      const previousMeasurements = queryClient.getQueryData(['measurements', currentPage?.id]);

      // Optimistically update
      queryClient.setQueryData(['measurements', currentPage?.id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((measurement: any) =>
            measurement.id === id
              ? { ...measurement, ...data, updatedAt: new Date().toISOString() }
              : measurement
          ),
        };
      });

      return { previousMeasurements };
    },
    onSuccess: () => {
      setPendingChanges(prev => prev - 1);
      queryClient.invalidateQueries({ queryKey: ['measurements', currentPage?.id] });
    },
    onError: (error: any, variables, context) => {
      setPendingChanges(prev => prev - 1);
      setSaveState('error');
      showToast.error(error.message || 'Erreur lors de la modification');

      // Rollback
      if (context?.previousMeasurements) {
        queryClient.setQueryData(['measurements', currentPage?.id], context.previousMeasurements);
      }
    },
    onSettled: () => {
      setPendingChanges(prev => {
        if (prev <= 0) {
          setSaveState('saved');
        }
        return prev;
      });
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: async (measurementId: number) => {
      // Use collaborative sync if session is active, otherwise fall back to direct API
      if (session && socket?.connected) {
        const success = await deleteMetrageSync(measurementId);
        if (!success) throw new Error('Échec de la suppression du métrage');
        return;
      }
      return metrageApi.deleteMeasurement(measurementId);
    },
    onMutate: async (measurementId) => {
      setSaveState('saving');
      setPendingChanges(prev => prev + 1);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['measurements', currentPage?.id] });

      // Snapshot the previous value
      const previousMeasurements = queryClient.getQueryData(['measurements', currentPage?.id]);

      // Optimistically remove the measurement
      queryClient.setQueryData(['measurements', currentPage?.id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.filter((measurement: any) => measurement.id !== measurementId),
        };
      });

      return { previousMeasurements };
    },
    onSuccess: () => {
      setPendingChanges(prev => prev - 1);
      queryClient.invalidateQueries({ queryKey: ['measurements', currentPage?.id] });
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
    },
    onError: (error: any, measurementId, context) => {
      setPendingChanges(prev => prev - 1);
      setSaveState('error');
      showToast.error(error.message || 'Erreur lors de la suppression');

      // Rollback
      if (context?.previousMeasurements) {
        queryClient.setQueryData(['measurements', currentPage?.id], context.previousMeasurements);
      }
    },
    onSettled: () => {
      setPendingChanges(prev => {
        if (prev <= 0) {
          setSaveState('saved');
        }
        return prev;
      });
    },
  });

  const updatePageStatusMutation = useMutation({
    mutationFn: ({ pageId, status }: { pageId: number; status: PageStatus }) =>
      metrageApi.updatePageStatus(pageId, status),
    onMutate: async () => {
      setSaveState('saving');
      setPendingChanges(prev => prev + 1);
    },
    onSuccess: () => {
      setPendingChanges(prev => prev - 1);
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
    },
    onError: (error: any) => {
      setPendingChanges(prev => prev - 1);
      setSaveState('error');
      showToast.error(error.message || 'Erreur lors de la mise à jour du statut');
    },
    onSettled: () => {
      setPendingChanges(prev => {
        if (prev <= 0) {
          setSaveState('saved');
        }
        return prev;
      });
    },
  });

  const updateBlueprintTitleMutation = useMutation({
    mutationFn: (title: string) =>
      blueprintsApi.update(blueprintId, { title }),
    onMutate: async () => {
      setSaveState('saving');
    },
    onSuccess: () => {
      setSaveState('saved');
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
      showToast.success('Titre mis à jour');
    },
    onError: (error: any) => {
      setSaveState('error');
      showToast.error(error.message || 'Erreur lors de la mise à jour du titre');
      // Revert to original title
      if (blueprint) {
        setBlueprintTitle(blueprint.title || blueprint.filename);
      }
    },
  });

  const updatePageTitleMutation = useMutation({
    mutationFn: ({ pageId, title }: { pageId: number; title: string }) =>
      blueprintsApi.updatePageTitle(blueprintId, pageId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
      showToast.success('Titre de page mis à jour');
      setEditingPageId(null);
      setEditingPageTitle('');
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la mise à jour du titre');
      setEditingPageId(null);
      setEditingPageTitle('');
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: number) =>
      blueprintsApi.deletePage(blueprintId, pageId),
    onSuccess: (_, deletedPageId) => {
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
      showToast.success('Page supprimée');

      // If we deleted the current page, navigate to first page
      if (currentPage?.id === deletedPageId) {
        setCurrentPageIndex(0);
      }
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la suppression de la page');
    },
  });


  // Calculate overall progress based on COMPLETED and VALIDATED pages
  const totalPages = blueprint?.pages?.length || 0;
  const completedPages = blueprint?.pages?.filter(
    (p) => p.status === PageStatus.COMPLETED || p.status === PageStatus.VALIDATED
  ).length || 0;
  const progressPercentage = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;

  // Handle measurement creation from canvas (called on double-click)
  const handleMeasurementCreate = useCallback((measurement: any) => {
    if (!currentPage?.isCalibrated || !currentPage.pixelsPerMeter) {
      showToast.error('Veuillez d\'abord calibrer la page');
      return;
    }

    // Check if page is locked (completed or validated)
    const pageStatus = currentPage.status || PageStatus.PENDING;
    if (pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED) {
      showToast.error('Impossible de modifier une page terminée ou validée');
      return;
    }

    // Map canvas tool type to MetrageType
    let type: MetrageType;
    switch (measurement.type) {
      case 'distance':
        // Check if it's a curve (multiple points) or simple line (2 points)
        type = measurement.points.length > 2 ? MetrageType.POLYLINE : MetrageType.LINE;
        break;
      case 'surface':
      case 'polygon':
        type = MetrageType.POLYGON;
        break;
      case 'volume':
        type = MetrageType.VOLUME;
        break;
      case 'count':
        type = MetrageType.POINT;
        break;
      default:
        console.warn('Unknown measurement type:', measurement.type);
        return;
    }

    // Convert points format
    let geometry: MeasurementGeometry;
    if (type === MetrageType.LINE) {
      geometry = { points: [measurement.points[0], measurement.points[1]] as [any, any] };
    } else if (type === MetrageType.POINT) {
      // For counting mode, we have multiple points to store as a single measurement
      if (measurement.points.length > 1) {
        // Multiple counting points - use PolylineGeometry to store all points
        geometry = { points: measurement.points };
      } else {
        // Single point
        geometry = { x: measurement.points[0].x, y: measurement.points[0].y };
      }
    } else {
      geometry = { points: measurement.points };
    }

    // Special handling for counting mode
    if (type === MetrageType.POINT && countingItemData) {
      // Direct creation with stored counting item data
      const measurementData: CreateMeasurementData = {
        type,
        categoryId: countingItemData.categoryId,
        itemId: countingItemData.itemId,
        geometry,
        color: measurement.color || '#00FF00',
        label: measurement.label, // Include the "#index ItemName" label
        strokeWidth: 3,
        opacity: 0.8,
      };

      createMeasurementMutation.mutate(measurementData);
      setCountingItemData(null); // Reset counting data
      return;
    }

    // Store pending measurement and open modal for other types
    setPendingMeasurement({
      type,
      geometry,
      color: measurement.color || '#3B82F6',
    });
    setIsCreateModalOpen(true);
  }, [currentPage, countingItemData, createMeasurementMutation]);

  // Handle create measurement confirmation from modal
  const handleConfirmCreate = useCallback(
    (data: {
      categoryId: number;
      itemId: number;
      label?: string;
      comment?: string;
      height?: number;
    }) => {
      if (!pendingMeasurement || !currentPage?.pixelsPerMeter) return;

      const { type, geometry, color } = pendingMeasurement;

      // Create measurement data
      // Note: Backend will calculate the final quantity based on geometry and height
      const measurementData: CreateMeasurementData = {
        type,
        categoryId: data.categoryId,
        itemId: data.itemId,
        geometry,
        color,
        label: data.label,
        comment: data.comment,
        height: data.height,
        strokeWidth: 2,
        opacity: 0.7,
      };

      createMeasurementMutation.mutate(measurementData);

      // Clean up
      setPendingMeasurement(null);
      setIsCreateModalOpen(false);
    },
    [pendingMeasurement, currentPage, createMeasurementMutation]
  );

  // Handle counting mode request
  const handleCountingModeRequest = useCallback(() => {
    if (!currentPage?.isCalibrated || !currentPage.pixelsPerMeter) {
      showToast.error('Veuillez d\'abord calibrer la page');
      return;
    }

    // Open modal to select the item to count
    setIsCountingModalOpen(true);
  }, [currentPage]);

  // Handle counting item selection
  const handleCountingItemSelect = useCallback((data: { categoryId: number; itemId: number; label?: string }) => {
    setIsCountingModalOpen(false);

    // Find the category color from ouvrage data
    const categories = ouvrageData?.data || [];
    const category = categories.find(cat => cat.id === data.categoryId);
    const item = category?.items?.find(item => item.id === data.itemId);
    const color = item?.color || category?.color || '#10B981'; // Fallback to green

    setCountingItemData({
      categoryId: data.categoryId,
      itemId: data.itemId,
      itemName: data.label || 'Item',
      color,
    });

    // Start counting mode in canvas
    canvasRef.current?.startCountingMode();
  }, [ouvrageData]);

  // Handle measurement edit
  const handleEditMeasurement = useCallback((measurement: Measurement) => {
    // Check if page is locked
    const pageStatus = currentPage?.status || PageStatus.PENDING;
    if (pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED) {
      showToast.error('Impossible de modifier une page terminée ou validée');
      return;
    }

    // Collaborative: Check if measurement is locked by another user
    if (session && isMetrageLocked(measurement.id)) {
      const lockInfo = getLockInfo(measurement.id);
      if (lockInfo && currentUserId && lockInfo.lockedBy !== currentUserId) {
        showToast.error(`Ce métrage est en cours d'édition par ${lockInfo.lockedByName || 'un autre utilisateur'}`);
        return;
      }
    }

    // Collaborative: Request lock before editing
    if (session && socket?.connected) {
      lockMetrage(measurement.id);
    }

    setEditingMeasurement(measurement);
    setIsDetailsModalOpen(true);
  }, [currentPage, session, isMetrageLocked, getLockInfo, currentUserId, socket, lockMetrage]);

  // Handle measurement update
  const handleUpdateMeasurement = useCallback((measurementId: number, data: any) => {
    // Check if page is locked
    const pageStatus = currentPage?.status || PageStatus.PENDING;
    if (pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED) {
      showToast.error('Impossible de modifier une page terminée ou validée');
      return;
    }

    updateMeasurementMutation.mutate({ id: measurementId, data });

    // Collaborative: Release lock after save
    if (session && socket?.connected) {
      unlockMetrage(measurementId);
    }

    setIsDetailsModalOpen(false);
    setEditingMeasurement(null);
  }, [currentPage, updateMeasurementMutation, session, socket, unlockMetrage]);

  // Handle measurement delete
  const handleDeleteMeasurement = useCallback((measurementId: number) => {
    // Check if page is locked
    const pageStatus = currentPage?.status || PageStatus.PENDING;
    if (pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED) {
      showToast.error('Impossible de modifier une page terminée ou validée');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer ce métrage ?')) {
      deleteMeasurementMutation.mutate(measurementId);
    }
  }, [currentPage, deleteMeasurementMutation]);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  // Toggle counting group expansion
  const toggleCountingGroup = useCallback((groupKey: string) => {
    setExpandedCountingGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
        : [...prev, groupKey]
    );
  }, []);

  // Handle history change
  const handleHistoryChange = useCallback((canUndoNow: boolean, canRedoNow: boolean) => {
    setCanUndo(canUndoNow);
    setCanRedo(canRedoNow);
  }, []);

  // Handle calibration complete
  const handleCalibrationComplete = useCallback((pixelsPerMeter: number, applyToAll: boolean) => {
    console.log('Calibration completed:', pixelsPerMeter, 'Apply to all:', applyToAll);
    // Refresh blueprint data to get updated page info
    queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
  }, [queryClient, blueprintId]);

  // Check if page is not calibrated and show suggestion modal
  useEffect(() => {
    if (currentPage && !currentPage.isCalibrated && blueprint?.pages) {
      const calibratedPages = blueprint.pages.filter((p) => p.isCalibrated && p.id !== currentPage.id);
      if (calibratedPages.length > 0) {
        setIsSuggestionModalOpen(true);
      }
    }
  }, [currentPage?.id, currentPage?.isCalibrated, blueprint?.pages]);

  // Handle copy calibration from another page
  const handleCopyCalibration = useCallback(async (sourcePageId: number) => {
    if (!currentPage) return;

    try {
      await metrageApi.copyCalibration(currentPage.id, sourcePageId);
      showToast.success('Calibration copiée avec succès');
      queryClient.invalidateQueries({ queryKey: ['blueprint', blueprintId] });
      setIsSuggestionModalOpen(false);
    } catch (error: any) {
      showToast.error(error.message || 'Erreur lors de la copie de la calibration');
    }
  }, [currentPage, blueprintId, queryClient]);

  // Handle manual calibration selection
  const handleManualCalibration = useCallback(() => {
    setIsSuggestionModalOpen(false);
    // Automatically select the calibrate tool
    setActiveTool('calibrate');
  }, []);

  // Get calibrated pages for suggestion modal
  const calibratedPages = blueprint?.pages?.filter(
    (p) => p.isCalibrated && p.id !== currentPage?.id
  ) || [];

  // Handle page status update with confirmation
  const handleRequestStatusChange = useCallback((pageId: number, newStatus: PageStatus, pageName: string) => {
    setStatusConfirmDialog({
      isOpen: true,
      pageId,
      newStatus,
      pageName,
    });
    setOpenPageMenuId(null);
    setMenuButtonRect(null);
  }, []);

  const handleConfirmStatusChange = useCallback(() => {
    if (!statusConfirmDialog) return;

    updatePageStatusMutation.mutate({
      pageId: statusConfirmDialog.pageId,
      status: statusConfirmDialog.newStatus
    });

    setStatusConfirmDialog(null);
  }, [statusConfirmDialog, updatePageStatusMutation]);

  const handleCancelStatusChange = useCallback(() => {
    setStatusConfirmDialog(null);
  }, []);

  const handleSaveBlueprintTitle = useCallback(() => {
    if (!blueprint) return;

    const trimmedTitle = blueprintTitle.trim();
    const currentTitle = blueprint.title || blueprint.filename;

    // Don't save if title is empty or hasn't changed
    if (!trimmedTitle || trimmedTitle === currentTitle) {
      setIsEditingTitle(false);
      setBlueprintTitle(currentTitle);
      return;
    }

    // Save the title
    updateBlueprintTitleMutation.mutate(trimmedTitle);
    setIsEditingTitle(false);
  }, [blueprintTitle, blueprint, updateBlueprintTitleMutation]);

  const handleSavePageTitle = useCallback((pageId: number, currentTitle?: string) => {
    const trimmedTitle = editingPageTitle.trim();

    // Don't save if title hasn't changed or is empty
    if (trimmedTitle === currentTitle || trimmedTitle.length === 0) {
      setEditingPageId(null);
      setEditingPageTitle('');
      return;
    }

    // Save the title
    updatePageTitleMutation.mutate({ pageId, title: trimmedTitle });
  }, [editingPageTitle, updatePageTitleMutation]);

  const handleRequestDeletePage = useCallback((pageId: number, pageName: string) => {
    setDeleteConfirmDialog({ pageId, pageName });
    setOpenPageMenuId(null);
    setMenuButtonRect(null);
  }, []);

  const handleConfirmDeletePage = useCallback(() => {
    if (!deleteConfirmDialog) return;

    deletePageMutation.mutate(deleteConfirmDialog.pageId);
    setDeleteConfirmDialog(null);
  }, [deleteConfirmDialog, deletePageMutation]);

  const handleCancelDeletePage = useCallback(() => {
    setDeleteConfirmDialog(null);
  }, []);

  // Handle navigation with unsaved changes check
  const handleNavigate = useCallback((path: string) => {
    if (pendingChanges > 0) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      router.push(path);
    }
  }, [pendingChanges, router]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, [pendingNavigation, router]);

  const cancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, []);

  // Warn user before leaving if there are pending changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingChanges]);



  // Handle left sidebar content visibility with delay
  useEffect(() => {
    if (leftSidebarOpen) {
      // Opening: show content after animation starts
      const timer = setTimeout(() => setShowLeftContent(true), 40);
      return () => clearTimeout(timer);
    } else {
      // Closing: hide content immediately
      setShowLeftContent(false);
    }
  }, [leftSidebarOpen]);

  // Handle right sidebar content visibility with delay
  useEffect(() => {
    if (rightSidebarOpen) {
      // Opening: show content after animation starts
      const timer = setTimeout(() => setShowRightContent(true), 40);
      return () => clearTimeout(timer);
    } else {
      // Closing: hide content immediately
      setShowRightContent(false);
    }
  }, [rightSidebarOpen]);

  // Force canvas resize when sidebars open/close
  useEffect(() => {
    // Delay resize until after sidebar animation completes
    const timeout = setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.fitToScreen();
      }
    }, 120);

    return () => clearTimeout(timeout);
  }, [leftSidebarOpen, rightSidebarOpen]);

  // Track previous measurements to detect new ones
  const prevMeasurementsRef = useRef<Measurement[]>([]);
  const isFirstRenderRef = useRef(true);

  // Auto-expand category and blink new measurements
  useEffect(() => {
    if (measurements.length === 0) return;

    // Skip animation on first render (initial page load)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevMeasurementsRef.current = measurements;
      return;
    }

    // Find new measurements (not in previous list)
    const prevIds = new Set(prevMeasurementsRef.current.map(m => m.id));
    const newMeasurements = measurements.filter(m => !prevIds.has(m.id));

    if (newMeasurements.length > 0) {
      // Get the latest new measurement
      const latestMeasurement = newMeasurements[newMeasurements.length - 1];

      // Check if this is a backend confirmation of an optimistic update
      // (optimistic measurements have negative IDs, real ones have positive IDs)
      const isBackendConfirmation = latestMeasurement.id > 0 && prevMeasurementsRef.current.some(prevM =>
        prevM.id < 0 && // Was optimistic (negative ID)
        prevM.categoryId === latestMeasurement.categoryId &&
        prevM.itemId === latestMeasurement.itemId &&
        prevM.type === latestMeasurement.type
      );

      // Only animate for truly new measurements, not backend confirmations
      if (!isBackendConfirmation) {
        const categoryId = latestMeasurement.categoryId;

        // Auto-expand the category
        setExpandedCategories(prev => {
          if (!prev.includes(categoryId)) {
            return [...prev, categoryId];
          }
          return prev;
        });

        // For counting measurements, also expand the group
        if (latestMeasurement.type === MetrageType.POINT) {
          const groupKey = `${categoryId}-${latestMeasurement.itemId}`;
          setExpandedCountingGroups(prev => {
            if (!prev.includes(groupKey)) {
              return [...prev, groupKey];
            }
            return prev;
          });
        }

        // Start blinking animation
        setBlinkingMeasurementId(latestMeasurement.id);

        // Stop blinking after animation completes (2 blinks × 0.6s = 1.2s)
        setTimeout(() => {
          setBlinkingMeasurementId(null);
        }, 1200);
      }

      // Update previous measurements
      prevMeasurementsRef.current = measurements;
    }

    // Update ref even if no new measurements
    prevMeasurementsRef.current = measurements;
  }, [measurements]);

  // v2.1.0: Throttled cursor tracking (250ms = 4fps, optimized for Cloud Run costs)
  // Only send if others are on the same page (shouldSendCursor)
  const handleCursorMove = useThrottledCursor(sendCursorPosition, {
    delay: 250, // v2.1.0: 250ms minimum (not less!)
    shouldSend: shouldSendCursor, // v2.1.0: Don't send if alone on page
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement du plan...</p>
        </div>
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan introuvable</h3>
          <p className="text-gray-600 mb-4">{(error as Error)?.message || 'Ce plan n\'existe pas'}</p>
          <button
            onClick={() => router.push('/metres')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Retour aux plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm z-30">
        {/* Left Section */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => handleNavigate('/metres')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={blueprintTitle}
                onChange={(e) => setBlueprintTitle(e.target.value)}
                onBlur={handleSaveBlueprintTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveBlueprintTitle();
                  } else if (e.key === 'Escape') {
                    if (blueprint) {
                      setBlueprintTitle(blueprint.title || blueprint.filename);
                    }
                    setIsEditingTitle(false);
                  }
                }}
                className="px-3 py-1.5 border-2 border-primary rounded-lg font-semibold text-gray-900 focus:outline-none"
                autoFocus
                disabled={updateBlueprintTitleMutation.isPending}
              />
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Title edit button clicked!', { blueprint });
                  if (!blueprint) {
                    console.log('Blueprint not loaded yet');
                    return;
                  }
                  console.log('Setting edit mode ON');
                  setBlueprintTitle(blueprint.title || blueprint.filename);
                  setIsEditingTitle(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors group cursor-pointer"
                type="button"
              >
                <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                  {blueprint?.title || blueprint?.filename}
                </span>
                <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
              </button>
            )}

          </div>

          {/* Page Status Indicator */}
          {(() => {
            const pageStatus = currentPage?.status || PageStatus.PENDING;
            const isPageLocked = pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED;

            if (!isPageLocked) return null;

            return (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">
                  Page verrouillée - {statusConfig[pageStatus].label}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Center Section - Toolbar */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            const pageStatus = currentPage?.status || PageStatus.PENDING;
            const isPageLocked = pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED;
            const isToolDisabled = isPageLocked && tool.id !== 'select';

            return (
              <button
                key={tool.id}
                onClick={() => !isToolDisabled && setActiveTool(tool.id as ToolType)}
                disabled={isToolDisabled}
                className={`
                  p-2.5 rounded-md transition-all relative group
                  ${isActive ? 'bg-white shadow-sm text-primary' : 'hover:bg-gray-200 text-gray-600'}
                  ${isToolDisabled ? 'opacity-40 cursor-not-allowed hover:bg-gray-100' : ''}
                `}
                title={isToolDisabled ? 'Page verrouillée (terminée ou validée)' : `${tool.label} (${tool.shortcut})`}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {isToolDisabled ? 'Page verrouillée' : tool.label}
                  {!isToolDisabled && <span className="ml-2 text-gray-400">{tool.shortcut}</span>}
                </div>
              </button>
            );
          })}

          <div className="w-px h-8 bg-gray-300 mx-1" />

          {(() => {
            const pageStatus = currentPage?.status || PageStatus.PENDING;
            const isPageLocked = pageStatus === PageStatus.COMPLETED || pageStatus === PageStatus.VALIDATED;

            return (
              <>
                <button
                  onClick={() => canvasRef.current?.undo()}
                  disabled={!canUndo || isPageLocked}
                  className="p-2.5 rounded-md hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isPageLocked ? "Page verrouillée" : "Annuler (Ctrl+Z)"}
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => canvasRef.current?.redo()}
                  disabled={!canRedo || isPageLocked}
                  className="p-2.5 rounded-md hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isPageLocked ? "Page verrouillée" : "Refaire (Ctrl+Y)"}
                >
                  <Redo2 className="w-5 h-5" />
                </button>
              </>
            );
          })()}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Collaboration: Status + Participants + Invite */}
          {session && (
            <div className="flex items-center gap-2">
              {/* Connection Status Dot */}
              {/* <ConnectionStatus
                isConnected={isConnected}
                isReconnecting={isReconnecting}
                isSyncing={isSyncing}
              /> */}

              {/* Participants Avatars - Always show if session exists */}
              <ParticipantsList
                participants={participants}
                currentUserId={currentUserId}
              />

              {/* Invite Button */}
              <InviteButton sessionId={session.id} />
            </div>
          )}

          {session && <div className="w-px h-8 bg-gray-300" />}

          {/* Ouvrage Management Button */}
          <button
            onClick={() => setIsOuvrageModalOpen(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            title="Gérer les types d'ouvrages"
          >
            <Layers className="w-4 h-4" />
            <span>Types d'ouvrages</span>
          </button>

          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-sm">
            {saveState === 'saving' && (
              <>
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs text-blue-600 font-medium">Sauvegarde...</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <Cloud className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Sauvegardé</span>
              </>
            )}
            {saveState === 'error' && (
              <>
                <CloudOff className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Erreur</span>
              </>
            )}
          </div>

          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Paramètres">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Pages */}
        <div className={`relative bg-white border-r border-gray-200 flex flex-col flex-shrink-0 sidebar-transition overflow-hidden ${leftSidebarOpen ? 'w-80' : 'w-16'}`}>
          {/* Toggle Button */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="absolute top-4 right-2 z-20 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {leftSidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center flex-shrink-0 min-h-[65px]">
              {showLeftContent && (
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <h2 className="font-semibold text-gray-900 whitespace-nowrap">Pages du plan</h2>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className={`border-b border-gray-200 flex-shrink-0 ${showLeftContent ? 'p-3 space-y-3' : 'h-0 overflow-hidden'}`}>

              <div className="flex gap-2">
                {(['all', 'pending', 'complete'] as FilterType[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPageFilter(filter)}
                    className={`
                        flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                        ${pageFilter === filter ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                  >
                    {filter === 'all' ? 'Tous' : filter === 'pending' ? 'En attente' : 'Complètes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages List */}
            {showLeftContent && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-2 optimize-render">
                  {filteredPages.map((page) => {
                    const status: PageStatus = page.status || PageStatus.PENDING;
                    const actualIndex = pageIndexMap.get(page.id) ?? -1;

                    return (
                      <div
                        key={page.id}
                        onClick={() => setCurrentPageIndex(actualIndex)}
                        className={`
                        w-full p-3 rounded-lg border-2 cursor-pointer group
                        ${currentPageIndex === actualIndex ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                      `}
                        style={{
                          transition: 'border-color 0.15s ease, background-color 0.15s ease'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          {page.thumbnailUrl || page.imageUrl ? (
                            <img
                              src={page.thumbnailUrl || page.imageUrl}
                              alt={`Page ${page.pageNumber}`}
                              className="w-16 h-20 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {editingPageId === page.id ? (
                              <input
                                type="text"
                                value={editingPageTitle}
                                onChange={(e) => setEditingPageTitle(e.target.value)}
                                onBlur={() => handleSavePageTitle(page.id, page.title)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSavePageTitle(page.id, page.title);
                                  } else if (e.key === 'Escape') {
                                    setEditingPageId(null);
                                    setEditingPageTitle('');
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-gray-900 font-medium border border-primary rounded px-2 py-1 mb-2 w-full focus:outline-none"
                                autoFocus
                                disabled={updatePageTitleMutation.isPending}
                              />
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPageId(page.id);
                                  setEditingPageTitle(page.title || '');
                                }}
                                className="text-left w-full mb-2 hover:bg-gray-100 rounded px-2 py-1 -mx-2 group"
                              >
                                {page.title ? (
                                  <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                                    {page.title}
                                    <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                  </p>
                                ) : (
                                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    Page {page.pageNumber}
                                    <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                  </p>
                                )}
                              </button>
                            )}
                            <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
                              {statusConfig[status].label}
                            </span>
                          </div>

                          {/* Kebab Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openPageMenuId === page.id) {
                                  setOpenPageMenuId(null);
                                  setMenuButtonRect(null);
                                } else {
                                  setMenuButtonRect(e.currentTarget.getBoundingClientRect());
                                  setOpenPageMenuId(page.id);
                                }
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>

                            {/* Dropdown Menu - Rendered via Portal */}
                            {openPageMenuId === page.id && menuButtonRect && typeof window !== 'undefined' && createPortal(
                              <>
                                {/* Backdrop */}
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenPageMenuId(null);
                                    setMenuButtonRect(null);
                                  }}
                                />

                                {/* Menu */}
                                <div
                                  className="fixed w-48 p-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 cursor-pointer"
                                  style={{
                                    top: `${menuButtonRect.bottom + 4}px`,
                                    left: `${menuButtonRect.right - 192}px`, // 192px = w-48
                                  }}
                                >
                                  {/* Show actions based on current status */}
                                  {(status === PageStatus.PENDING || status === PageStatus.IN_PROGRESS) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestStatusChange(page.id, PageStatus.COMPLETED, `Page ${page.pageNumber}`);
                                      }}
                                      className="w-full px-2 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 flex items-center gap-2 rounded-md cursor-pointer"
                                    >
                                      <Check className="w-4 h-4 text-blue-600" />
                                      Marquer comme terminé
                                    </button>
                                  )}
                                  {status === PageStatus.COMPLETED && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestStatusChange(page.id, PageStatus.VALIDATED, `Page ${page.pageNumber}`);
                                        }}
                                        className="w-full px-2 py-2 text-left text-xs text-gray-700 hover:bg-green-50 flex items-center gap-2 rounded-md cursor-pointer"
                                      >
                                        <CheckCheck className="w-4 h-4 text-green-600" />
                                        Marquer comme validé
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestStatusChange(page.id, PageStatus.IN_PROGRESS, `Page ${page.pageNumber}`);
                                        }}
                                        className="w-full px-2 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-md cursor-pointer"
                                      >
                                        <RotateCcw className="w-4 h-4 text-gray-600" />
                                        Remettre en cours
                                      </button>
                                    </>
                                  )}
                                  {status === PageStatus.VALIDATED && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestStatusChange(page.id, PageStatus.IN_PROGRESS, `Page ${page.pageNumber}`);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <RotateCcw className="w-4 h-4 text-gray-600" />
                                      Remettre en cours
                                    </button>
                                  )}

                                  {/* Separator */}
                                  <div className="border-t border-gray-200 my-1"></div>

                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRequestDeletePage(page.id, page.title || `Page ${page.pageNumber}`);
                                    }}
                                    className="w-full px-2 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-md cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer la page
                                  </button>
                                </div>
                              </>,
                              document.body
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTRAL CANVAS */}
        <div className="flex-1 flex flex-col bg-gray-100 relative overflow-hidden">
          {/* Canvas Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-lg p-1 flex flex-col gap-1">
              <button
                onClick={() => canvasRef.current?.zoomIn()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom avant (+)"
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => canvasRef.current?.zoomOut()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom arrière (-)"
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
              <div className="w-full h-px bg-gray-200" />
              <button
                onClick={() => canvasRef.current?.fitToScreen()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Ajuster à l'écran (F)"
              >
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </button>
              <div className="w-full h-px bg-gray-200" />
              <button
                onClick={() => setMeasurementsVisible(!measurementsVisible)}
                className={`p-2 hover:bg-gray-100 rounded transition-colors ${measurementsVisible ? 'text-gray-700' : 'text-gray-400'
                  }`}
                title={measurementsVisible ? 'Masquer les mesures' : 'Afficher les mesures'}
              >
                {measurementsVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative" onMouseMove={handleCursorMove}>
            {/* Collaboration: Cursors Overlay */}
            <CollaborativeCursors cursors={cursors} />

            {currentPage ? (
              currentPage.imageUrl ? (
                <MetrageCanvas
                  key={`canvas-${currentPage.id}`}
                  ref={canvasRef}
                  pageId={currentPage.id}
                  blueprintId={blueprintId}
                  imageUrl={currentPage.imageUrl}
                  activeTool={activeTool}
                  isCalibrated={currentPage.isCalibrated}
                  pixelsPerMeter={currentPage.pixelsPerMeter ? Number(currentPage.pixelsPerMeter) : undefined}
                  hasOtherPages={(blueprint?.pages?.length || 0) > 1}
                  onMeasurementCreate={handleMeasurementCreate}
                  onHistoryChange={handleHistoryChange}
                  onCalibrationComplete={handleCalibrationComplete}
                  existingMeasurements={canvasMeasurements}
                  highlightedMeasurementId={highlightedMeasurementId}
                  highlightedMeasurementIds={highlightedMeasurementIds}
                  onCountingModeRequest={handleCountingModeRequest}
                  onToolChange={setActiveTool}
                  countingItemData={countingItemData}
                  measurementsVisible={measurementsVisible}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Image non disponible</p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Sélectionnez une page</p>
                </div>
              </div>
            )}
          </div>

          {/* Page Navigation Footer */}
          {currentPage && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">
                  Page {currentPage.pageNumber} / {blueprint.totalPages}
                </span>
                {currentPage.scale && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono">
                    Échelle {currentPage.scale}
                  </span>
                )}
                <span className="text-xs text-gray-600">
                  {currentPage.width} × {currentPage.height} px
                </span>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">Progression:</span>
                      <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
                    </div>
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {completedPages}/{totalPages} pages
                  </span>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.min((blueprint.pages?.length || 1) - 1, prev + 1))}
                    disabled={currentPageIndex === (blueprint.pages?.length || 1) - 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - Measures & AI */}
        <div className={`relative bg-white border-l border-gray-200 flex flex-col flex-shrink-0 sidebar-transition overflow-hidden ${rightSidebarOpen ? 'w-96' : 'w-16'}`}>
          {/* Toggle Button */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="absolute top-4 right-2 z-20 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {rightSidebarOpen ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 min-h-[65px]">
              {showRightContent && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setRightTab('measures')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${rightTab === 'measures' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Mesures
                  </button>
                  <button
                    onClick={() => setRightTab('ai')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${rightTab === 'ai' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    ✨ Assistant IA
                  </button>
                </div>
              )}
            </div>

            {showRightContent && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {rightTab === 'measures' ? (
                  <>
                    {/* Search & Filters */}
                    <div className="p-3 border-b border-gray-200 space-y-3 flex-shrink-0">
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher une mesure..."
                            value={measurementSearchQuery}
                            onChange={(e) => setMeasurementSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        {measurementSearchQuery && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {filteredMeasurements.length} résultat{filteredMeasurements.length > 1 ? 's' : ''} sur {measurements.length}
                            </span>
                            {filteredMeasurements.length !== measurements.length && (
                              <button
                                onClick={() => setMeasurementSearchQuery('')}
                                className="text-primary hover:text-primary-hover font-medium"
                              >
                                Réinitialiser
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Measures List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {measurements.length === 0 ? (
                        <div className="text-center py-12">
                          <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 text-sm">Aucun métrage</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Utilisez les outils pour mesurer
                          </p>
                        </div>
                      ) : filteredMeasurements.length === 0 ? (
                        <div className="text-center py-12">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 text-sm">Aucun résultat</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Essayez avec d'autres mots-clés
                          </p>
                        </div>
                      ) : (
                        // Group measurements by category
                        Object.entries(
                          filteredMeasurements.reduce((acc, measurement) => {
                            const catId = measurement.categoryId;
                            if (!acc[catId]) {
                              acc[catId] = {
                                category: measurement.category,
                                items: [],
                              };
                            }
                            acc[catId].items.push(measurement);
                            return acc;
                          }, {} as Record<number, { category: any; items: Measurement[] }>)
                        )
                          // Sort categories by most recent measurement (newest category first)
                          .sort((a, b) => {
                            const latestA = Math.max(...a[1].items.map(m => new Date(m.createdAt).getTime()));
                            const latestB = Math.max(...b[1].items.map(m => new Date(m.createdAt).getTime()));
                            return latestB - latestA; // Descending (newest first)
                          })
                          .map(([categoryId, group]) => {
                            // Sort measurements within category by creation date (oldest first)
                            group.items.sort((a, b) =>
                              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                            return [categoryId, group] as [string, typeof group];
                          })
                          .map(([categoryId, group]) => (
                            <div key={categoryId} className="border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleCategory(Number(categoryId))}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                style={{
                                  background: `linear-gradient(135deg, ${group.category.color}15 0%, ${group.category.color}05 100%)`,
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedCategories.includes(Number(categoryId)) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                  )}
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-sm"
                                    style={{ backgroundColor: group.category.color }}
                                  >
                                    {group.category.icon || group.category.title.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm">
                                    {group.category.title}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600">{group.items.length}</span>
                              </button>

                              {expandedCategories.includes(Number(categoryId)) && (
                                <div className="divide-y divide-gray-100">
                                  {(() => {
                                    // Separate counting measurements from others
                                    const countingMeasurements = group.items.filter(m => m.type === MetrageType.POINT);
                                    const otherMeasurements = group.items.filter(m => m.type !== MetrageType.POINT);

                                    // Group counting measurements by itemId
                                    const countingGroups = countingMeasurements.reduce((acc, m) => {
                                      const key = m.itemId;
                                      if (!acc[key]) {
                                        acc[key] = [];
                                      }
                                      acc[key].push(m);
                                      return acc;
                                    }, {} as Record<number, Measurement[]>);

                                    return (
                                      <>
                                        {/* Render counting groups */}
                                        {Object.entries(countingGroups).map(([itemId, countingItems]) => {
                                          const groupKey = `${categoryId}-${itemId}`;
                                          const isExpanded = expandedCountingGroups.includes(groupKey);

                                          // Sort counting items by their index number from label
                                          const sortedCountingItems = [...countingItems].sort((a, b) => {
                                            const matchA = a.label?.match(/^#(\d+)/);
                                            const matchB = b.label?.match(/^#(\d+)/);
                                            const numA = matchA ? parseInt(matchA[1], 10) : 0;
                                            const numB = matchB ? parseInt(matchB[1], 10) : 0;
                                            return numA - numB;
                                          });

                                          const firstItem = sortedCountingItems[0];
                                          const count = sortedCountingItems.length;

                                          return (
                                            <div key={`counting-group-${groupKey}`}>
                                              {/* Group Header */}
                                              <div
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleCountingGroup(groupKey);
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.stopPropagation();
                                                  setHighlightedCountingGroup(groupKey);
                                                  // Highlight all measurements in this group on canvas
                                                  setHighlightedMeasurementIds(sortedCountingItems.map(item => item.id.toString()));
                                                  setHighlightedMeasurementId(null); // Clear single highlight when group is highlighted
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.stopPropagation();
                                                  setHighlightedCountingGroup(null);
                                                  setHighlightedMeasurementIds([]);
                                                }}
                                                className={`p-3 hover:bg-green-50 transition-colors cursor-pointer ${highlightedCountingGroup === groupKey ? 'bg-green-50' : ''
                                                  }`}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {isExpanded ? (
                                                      <ChevronDown className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                                    ) : (
                                                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                                    )}
                                                    <span className="text-lg">{firstItem.item.icon || '📦'}</span>
                                                    <span className="text-sm text-gray-900 truncate font-medium">
                                                      {firstItem.item.title}
                                                    </span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                                                    {count} pcs
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Individual Counting Items */}
                                              {isExpanded && (
                                                <div className="bg-gray-50 divide-y divide-gray-100">
                                                  {sortedCountingItems.map((measurement) => (
                                                    <div
                                                      key={measurement.id}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedMeasurementId(measurement.id);
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        e.stopPropagation();
                                                        setHighlightedMeasurementId(measurement.id.toString());
                                                        setHighlightedMeasurementIds([]); // Clear group highlight when individual is highlighted
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        e.stopPropagation();
                                                        setHighlightedMeasurementId(null);
                                                      }}
                                                      className={`pl-12 pr-3 py-2 hover:bg-green-100 transition-colors cursor-pointer ${selectedMeasurementId === measurement.id ? 'bg-green-100' : ''
                                                        } ${blinkingMeasurementId === measurement.id ? 'animate-blink-highlight' : ''}`}
                                                    >
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                          <span className="text-sm text-gray-700 truncate">
                                                            {measurement.label}
                                                          </span>
                                                          {/* Collaborative: Lock indicator */}
                                                          {session && isMetrageLocked(measurement.id) && !isMetrageLockedByMe(measurement.id, currentUserId || 0) && (
                                                            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                                              🔒 {getLockInfo(measurement.id)?.lockedByName || 'Verrouillé'}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-1" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
                                                          {/* <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleEditMeasurement(measurement);
                                                            }}
                                                            className="p-1 hover:bg-green-200 rounded transition-colors"
                                                            title="Modifier"
                                                          >
                                                            <Edit2 className="w-3 h-3 text-green-700" />
                                                          </button> */}
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleDeleteMeasurement(measurement.id);
                                                            }}
                                                            className="p-1 hover:bg-red-100 rounded transition-colors"
                                                            title="Supprimer"
                                                          >
                                                            <Trash2 className="w-3 h-3 text-red-600" />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}

                                        {/* Render other (non-counting) measurements */}
                                        {otherMeasurements.map((measurement) => (
                                          <div
                                            key={measurement.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedMeasurementId(measurement.id);
                                            }}
                                            onMouseEnter={(e) => {
                                              e.stopPropagation();
                                              setHighlightedMeasurementId(measurement.id.toString());
                                            }}
                                            onMouseLeave={(e) => {
                                              e.stopPropagation();
                                              setHighlightedMeasurementId(null);
                                            }}
                                            className={`p-3 hover:bg-blue-50 transition-colors cursor-pointer ${selectedMeasurementId === measurement.id ? 'bg-blue-50' : ''
                                              } ${blinkingMeasurementId === measurement.id ? 'animate-blink-highlight' : ''}`}
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-lg">{measurement.item.icon || '📦'}</span>
                                                <span className="text-sm text-gray-900 truncate font-medium">
                                                  {measurement.label || measurement.item.title}
                                                </span>
                                                {/* Collaborative: Lock indicator */}
                                                {session && isMetrageLocked(measurement.id) && !isMetrageLockedByMe(measurement.id, currentUserId || 0) && (
                                                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                                    🔒 {getLockInfo(measurement.id)?.lockedByName || 'Verrouillé'}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
                                                {/* <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditMeasurement(measurement);
                                                  }}
                                                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                                                  title="Modifier"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                                </button> */}
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMeasurement(measurement.id);
                                                  }}
                                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                                  title="Supprimer"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Quantity and calculated surface/volume */}
                                            <div className="space-y-1">
                                              <div className="text-xs">
                                                <span className="text-gray-600">
                                                  {parseFloat(measurement.quantity).toFixed(2)} {measurement.unit}
                                                </span>
                                              </div>

                                              {/* Show calculated surface/volume if height is present */}
                                              {measurement.height && (
                                                <div className="flex items-center gap-1 text-xs">
                                                  {(measurement.type === MetrageType.LINE || measurement.type === MetrageType.POLYLINE) ? (
                                                    <>
                                                      <span className="text-gray-500">
                                                        Surface: {(parseFloat(measurement.quantity) * parseFloat(measurement.height.toString())).toFixed(2)} m²
                                                      </span>
                                                      <span className="text-gray-400">
                                                        (× {parseFloat(measurement.height.toString()).toFixed(2)}m hauteur)
                                                      </span>
                                                    </>
                                                  ) : measurement.type === MetrageType.POLYGON ? (
                                                    <>
                                                      <span className="text-gray-500">
                                                        Volume: {(parseFloat(measurement.quantity) * parseFloat(measurement.height.toString())).toFixed(2)} m³
                                                      </span>
                                                      <span className="text-gray-400">
                                                        (× {parseFloat(measurement.height.toString()).toFixed(2)}m épaisseur)
                                                      </span>
                                                    </>
                                                  ) : null}
                                                </div>
                                              )}
                                            </div>

                                            {measurement.comment && (
                                              <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                                                {measurement.comment}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </>
                ) : (
                  /* AI Assistant Tab - Conversational only */
                  <AIAssistantPanel
                    messages={aiMessages}
                    isAnalyzing={isAnalyzing}
                    onSendInstruction={sendInstruction}
                    onClearChat={clearChat}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calibration Suggestion Modal */}
      <CalibrationSuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
        calibratedPages={calibratedPages}
        onCopyCalibration={handleCopyCalibration}
        onManualCalibration={handleManualCalibration}
        currentPageNumber={currentPage?.pageNumber || 0}
      />

      {/* Ouvrage Management Modal */}
      <OuvrageManagementModal
        isOpen={isOuvrageModalOpen}
        onClose={() => setIsOuvrageModalOpen(false)}
      />

      {/* Measurement Details Modal */}
      <MeasurementDetailsModal
        measurement={editingMeasurement}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          // Collaborative: Release lock when closing modal
          if (session && socket?.connected && editingMeasurement) {
            unlockMetrage(editingMeasurement.id);
          }
          setIsDetailsModalOpen(false);
          setEditingMeasurement(null);
        }}
        onSave={handleUpdateMeasurement}
      />

      {/* Create Measurement Modal */}
      {pendingMeasurement && currentPage?.pixelsPerMeter && (
        <CreateMeasurementModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setPendingMeasurement(null);
          }}
          onConfirm={handleConfirmCreate}
          measurementType={pendingMeasurement.type}
          calculatedQuantity={calculateMeasurementQuantity(
            pendingMeasurement.type,
            pendingMeasurement.geometry,
            Number(currentPage.pixelsPerMeter),
            undefined
          )}
          unit={
            pendingMeasurement.type === MetrageType.LINE || pendingMeasurement.type === MetrageType.POLYLINE
              ? 'ml'
              : pendingMeasurement.type === MetrageType.POLYGON
                ? 'm²'
                : pendingMeasurement.type === MetrageType.VOLUME
                  ? 'm²'
                  : 'u'
          }
        />
      )}

      {/* Counting Mode Item Selection Modal */}
      {isCountingModalOpen && (
        <CreateMeasurementModal
          isOpen={isCountingModalOpen}
          onClose={() => setIsCountingModalOpen(false)}
          onConfirm={handleCountingItemSelect}
          measurementType={MetrageType.POINT}
          calculatedQuantity={0}
          unit="u"
        />
      )}

      {/* Status Change Confirmation Dialog */}
      {statusConfirmDialog && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {/* Dialog */}
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer le changement de statut
                </h3>
                <p className="text-sm text-gray-600">
                  Voulez-vous vraiment marquer{' '}
                  <span className="font-semibold text-gray-900">{statusConfirmDialog.pageName}</span> comme{' '}
                  <span className={`font-semibold ${statusConfirmDialog.newStatus === PageStatus.COMPLETED
                    ? 'text-blue-700'
                    : statusConfirmDialog.newStatus === PageStatus.VALIDATED
                      ? 'text-green-700'
                      : 'text-yellow-700'
                    }`}>
                    "{statusConfig[statusConfirmDialog.newStatus].label}"
                  </span> ?
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={handleCancelStatusChange}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${statusConfirmDialog.newStatus === PageStatus.COMPLETED
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : statusConfirmDialog.newStatus === PageStatus.VALIDATED
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Page Confirmation Dialog */}
      {deleteConfirmDialog && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {/* Dialog */}
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  Supprimer la page
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  Voulez-vous vraiment supprimer{' '}
                  <span className="font-semibold text-gray-900">{deleteConfirmDialog.pageName}</span> ?
                  <br />
                  <span className="text-red-600 font-medium">Cette action est irréversible.</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={handleCancelDeletePage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={deletePageMutation.isPending}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDeletePage}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deletePageMutation.isPending}
                >
                  {deletePageMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Global Loading Overlay - Status Update */}
      {updatePageStatusMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-900">Mise à jour du statut...</p>
          </div>
        </div>
      )}

      {/* Global Loading Overlay - Page Deletion */}
      {deletePageMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-900">Suppression de la page...</p>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Changements non sauvegardés
              </h3>
              <p className="text-sm text-gray-600">
                {pendingChanges > 0 ? (
                  <>
                    Vous avez <span className="font-semibold text-gray-900">{pendingChanges} changement{pendingChanges > 1 ? 's' : ''}</span> en cours de sauvegarde.
                    Voulez-vous vraiment quitter cette page ?
                  </>
                ) : (
                  'Êtes-vous sûr de vouloir quitter cette page ?'
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Rester sur la page
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Quitter sans sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
