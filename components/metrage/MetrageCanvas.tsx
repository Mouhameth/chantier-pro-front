'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Line, Circle, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Loader2 } from 'lucide-react';
import { metrageApi } from '@/lib/api/metrage';
import { showToast } from '@/lib/utils/toast';
import React from 'react';
import CalibrationModal from './CalibrationModal';

type ToolType = 'select' | 'distance' | 'surface' | 'polygon' | 'angle' | 'curve' | 'count' | 'volume' | 'calibrate';

interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id: string;
  type: ToolType;
  points: Point[];
  color: string;
  label?: string;
  value?: number;
  unit?: string;
}

interface MetrageCanvasProps {
  pageId: number;
  blueprintId: number;
  imageUrl: string;
  activeTool: ToolType;
  isCalibrated: boolean;
  pixelsPerMeter?: number;
  hasOtherPages?: boolean;
  onMeasurementCreate?: (measurement: Measurement) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onCalibrationComplete?: (pixelsPerMeter: number, applyToAll: boolean) => void;
  existingMeasurements?: Measurement[];
  highlightedMeasurementId?: string | null;
  highlightedMeasurementIds?: string[]; // For highlighting multiple measurements (e.g., counting groups)
  onCountingModeRequest?: () => void; // Called when count tool is selected to open item selection modal
  onToolChange?: (tool: ToolType) => void; // Called to change the active tool
  countingItemData?: { categoryId: number; itemId: number; itemName: string; color: string } | null;
  measurementsVisible?: boolean; // Toggle visibility of measurements on canvas
}

export interface MetrageCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  startCountingMode: () => void;
  stopCountingMode: () => void;
  cancelCountingMode: () => void;
}

// Component to load and display the image
function PlanImage({ src, onLoad }: { src: string; onLoad: (img: HTMLImageElement) => void }) {
  const [image, status] = useImage(src);

  useEffect(() => {
    if (image) {
      onLoad(image);
    }
  }, [image, status, onLoad]);

  if (status === 'loading') {
  } else if (status === 'failed') {
    console.error('Failed to load image:', src);
  }

  return image ? <KonvaImage image={image} /> : null;
}

const MetrageCanvas = forwardRef<MetrageCanvasHandle, MetrageCanvasProps>(({
  pageId,
  blueprintId,
  imageUrl,
  activeTool,
  isCalibrated,
  pixelsPerMeter = 100, // Default value for demo
  hasOtherPages = false,
  onMeasurementCreate,
  onHistoryChange,
  onCalibrationComplete,
  existingMeasurements = [],
  highlightedMeasurementId = null,
  highlightedMeasurementIds = [],
  onCountingModeRequest,
  onToolChange,
  countingItemData,
  measurementsVisible = true,
}, ref) => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>(existingMeasurements);
  const [hoveredMeasurement, setHoveredMeasurement] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<Point | null>(null);

  // Shake animation state
  const [shakingMeasurementId, setShakingMeasurementId] = useState<string | null>(null);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });

  // Double-click detection for polygon completion
  const lastClickTimeRef = useRef<number>(0);

  // Counting mode state
  const [isCountingMode, setIsCountingMode] = useState(false);
  const [countingPoints, setCountingPoints] = useState<Point[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<Measurement[][]>([existingMeasurements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Calibration modal state
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [calibrationData, setCalibrationData] = useState<{
    point1: Point;
    point2: Point;
    pixelDistance: number;
  } | null>(null);

  // Update stage size on container resize with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setStageDimensions({ width, height });
      }
    };

    // Initial size
    updateSize();

    // Listen to window resize with debounce
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 50);
    };

    window.addEventListener('resize', handleResize);

    // Observer for container size changes
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 50);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync existing measurements from props
  useEffect(() => {
    setMeasurements(existingMeasurements);
    setHistory([existingMeasurements]);
    setHistoryIndex(0);
  }, [existingMeasurements]);

  // Shake animation when measurement is highlighted
  useEffect(() => {
    if (!highlightedMeasurementId && highlightedMeasurementIds.length === 0) {
      setShakingMeasurementId(null);
      setShakeOffset({ x: 0, y: 0 });
      return;
    }

    // Start shaking - for single highlight, use that ID
    // For group highlight, we'll shake the first one (or we could shake all, but that might be too much)
    const idToShake = highlightedMeasurementId || (highlightedMeasurementIds.length > 0 ? highlightedMeasurementIds[0] : null);
    if (idToShake) {
      setShakingMeasurementId(idToShake);
    }

    const duration = 600; // Animation duration in ms
    const maxIntensity = 8; // Maximum shake intensity in pixels
    const frequency = 30; // Oscillations per second
    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Animation complete
        console.log('Shake animation complete');
        setShakingMeasurementId(null);
        setShakeOffset({ x: 0, y: 0 });
        return;
      }

      // Decay factor: shake reduces over time (strong at start, weak at end)
      const decay = Math.pow(1 - progress, 2); // Quadratic decay for smoother effect

      // Oscillating shake with high frequency
      const time = elapsed / 1000; // Convert to seconds
      const intensity = maxIntensity * decay;

      // Use sine waves for smooth oscillation
      const x = Math.sin(time * frequency) * intensity * (Math.random() * 0.5 + 0.5);
      const y = Math.cos(time * frequency * 1.3) * intensity * (Math.random() * 0.5 + 0.5);

      setShakeOffset({ x, y });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [highlightedMeasurementId, highlightedMeasurementIds]);

  // Trigger counting mode modal when count tool is selected
  useEffect(() => {
    if (activeTool === 'count' && !isCountingMode && onCountingModeRequest) {
      // Request parent to open the item selection modal
      onCountingModeRequest();
    }
  }, [activeTool, isCountingMode, onCountingModeRequest]);

  // Handle image load
  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    const imgWidth = img.width;
    const imgHeight = img.height;

    setImageSize(prev => {
      // Only update if dimensions changed to avoid infinite loop
      if (prev.width === imgWidth && prev.height === imgHeight) {
        return prev;
      }
      return { width: imgWidth, height: imgHeight };
    });

    // Calculate initial scale to fit image
    const scaleX = stageDimensions.width / imgWidth;
    const scaleY = stageDimensions.height / imgHeight;
    const initialScale = Math.min(scaleX, scaleY) * 0.9; // 0.9 for padding
    setScale(initialScale);

    // Center the image
    setStagePos({
      x: (stageDimensions.width - imgWidth * initialScale) / 2,
      y: (stageDimensions.height - imgHeight * initialScale) / 2,
    });
  }, [stageDimensions.width, stageDimensions.height]);

  // Handle wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1.05; // Smaller steps for smoother zoom
    const newScale = direction > 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

    // Limit zoom
    if (newScale < 0.1 || newScale > 10) return;

    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Calculate distance between two points
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    return pixelDistance / pixelsPerMeter; // Convert to meters
  };

  // Calculate angle between 3 points (p1 is the vertex)
  const calculateAngle = (p1: Point, p2: Point, p3: Point): number => {
    // Vector from vertex to first point
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    // Vector from vertex to third point
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    // Calculate angle using dot product and magnitudes
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    const angleRad = Math.acos(dot / (mag1 * mag2));
    const angleDeg = (angleRad * 180) / Math.PI;

    return angleDeg;
  };

  // Calculate polygon area
  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    const metersSquared = area / (pixelsPerMeter * pixelsPerMeter);
    return metersSquared;
  };

  // Add to history
  const addToHistory = useCallback((newMeasurements: Measurement[]) => {
    // Remove any history after current index (when undoing then adding new action)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newMeasurements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setMeasurements(newMeasurements);
  }, [history, historyIndex]);

  // Notify parent when history changes
  useEffect(() => {
    const canUndoNow = historyIndex > 0;
    const canRedoNow = historyIndex < history.length - 1;
    onHistoryChange?.(canUndoNow, canRedoNow);
  }, [historyIndex, history.length, onHistoryChange]);

  // Handle mouse down - start drawing
  const handleMouseDown = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Pan with space key or select tool
    if (e.evt.button === 1 || e.evt.shiftKey || activeTool === 'select') {
      setIsPanning(true);
      setLastPanPos(pos);
      return;
    }

    const point = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale,
    };

    // Handle calibration tool
    if (activeTool === 'calibrate') {
      if (currentPoints.length === 0) {
        setIsDrawing(true);
        setCurrentPoints([point]);
      } else if (currentPoints.length === 1) {
        // Calculate pixel distance
        const pixelDistance = Math.sqrt(
          Math.pow(point.x - currentPoints[0].x, 2) + Math.pow(point.y - currentPoints[0].y, 2)
        );

        // Store calibration data and open modal
        setCalibrationData({
          point1: currentPoints[0],
          point2: point,
          pixelDistance,
        });
        setIsCalibrationModalOpen(true);
        setCurrentPoints([]);
        setPreviewPoint(null);
        setIsDrawing(false);
      }
      return;
    }

    if (!isCalibrated) {
      return; // Silently ignore if not calibrated
    }

    if (activeTool === 'distance') {
      if (currentPoints.length === 0) {
        setIsDrawing(true);
        setCurrentPoints([point]);
      } else if (currentPoints.length === 1) {
        // Complete the distance measurement
        const newPoints = [...currentPoints, point];
        const distance = calculateDistance(currentPoints[0], point);
        const newMeasurement: Measurement = {
          id: Date.now().toString(),
          type: 'distance',
          points: newPoints,
          color: '#FF0000',
          value: parseFloat(distance.toFixed(2)),
          unit: 'ml',
          label: `${distance.toFixed(2)} ml`,
        };
        addToHistory([...measurements, newMeasurement]);
        onMeasurementCreate?.(newMeasurement);
        setCurrentPoints([]);
        setPreviewPoint(null);
        setIsDrawing(false);
      }
    } else if (activeTool === 'surface' || activeTool === 'polygon' || activeTool === 'volume') {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      // Detect double-click (within 300ms)
      if (timeSinceLastClick < 300 && currentPoints.length >= 3) {
        // This is a double-click - complete the polygon
        handleDoubleClick();
        return;
      }

      lastClickTimeRef.current = now;
      setIsDrawing(true);
      setCurrentPoints([...currentPoints, point]);
    } else if (activeTool === 'curve') {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      // Detect double-click (within 300ms) to finish curve
      if (timeSinceLastClick < 300 && currentPoints.length >= 2) {
        // Complete the curve (polyline)
        const newMeasurement: Measurement = {
          id: Date.now().toString(),
          type: 'distance', // Will be mapped to POLYLINE
          points: currentPoints,
          color: '#00BFFF',
          value: 0, // Will be calculated
          unit: 'ml',
          label: 'Courbe',
        };
        onMeasurementCreate?.(newMeasurement);
        setCurrentPoints([]);
        setPreviewPoint(null);
        setIsDrawing(false);
        return;
      }

      lastClickTimeRef.current = now;
      setIsDrawing(true);
      setCurrentPoints([...currentPoints, point]);
    } else if (activeTool === 'angle') {
      setIsDrawing(true);
      const newPoints = [...currentPoints, point];
      setCurrentPoints(newPoints);

      if (newPoints.length === 3) {
        // Calculate angle between 3 points
        const angle = calculateAngle(newPoints[0], newPoints[1], newPoints[2]);
        const newMeasurement: Measurement = {
          id: Date.now().toString(),
          type: 'angle', // Use angle type for proper display
          points: newPoints,
          color: '#FF00FF',
          value: angle,
          unit: '°',
          label: `${angle.toFixed(1)}°`,
        };
        // Add angle directly to local measurements without going through creation modal
        addToHistory([...measurements, newMeasurement]);
        setCurrentPoints([]);
        setPreviewPoint(null);
        setIsDrawing(false);
      }
    } else if (activeTool === 'count' && isCountingMode) {
      // Add counting point to the list
      setCountingPoints([...countingPoints, point]);
    }
  };

  // Handle mouse move - show preview
  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Handle panning
    if (isPanning && lastPanPos) {
      const dx = pos.x - lastPanPos.x;
      const dy = pos.y - lastPanPos.y;
      setStagePos({
        x: stagePos.x + dx,
        y: stagePos.y + dy,
      });
      setLastPanPos(pos);
      return;
    }

    if (!isDrawing) return;

    const point = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale,
    };

    // Update preview point for tools that need it
    if (activeTool === 'calibrate' || activeTool === 'distance') {
      if (currentPoints.length === 1) {
        setPreviewPoint(point);
      }
    } else if (activeTool === 'surface' || activeTool === 'polygon' || activeTool === 'volume') {
      // Always show preview for polygons while drawing
      if (currentPoints.length >= 1) {
        setPreviewPoint(point);
      }
    } else if (activeTool === 'curve') {
      // Show preview for curves (polylines)
      if (currentPoints.length >= 1) {
        setPreviewPoint(point);
      }
    } else if (activeTool === 'angle') {
      // Show preview for angle measurement
      if (currentPoints.length > 0 && currentPoints.length < 3) {
        setPreviewPoint(point);
      }
    }
  };

  // Handle mouse up - stop panning
  const handleMouseUp = () => {
    setIsPanning(false);
    setLastPanPos(null);
    setPreviewPoint(null);
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 10);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1);
    setScale(newScale);
  };

  const handleFitToScreen = () => {
    if (imageSize.width === 0 || imageSize.height === 0) return;

    // Calculate scale to fit image
    const scaleX = stageDimensions.width / imageSize.width;
    const scaleY = stageDimensions.height / imageSize.height;
    const fitScale = Math.min(scaleX, scaleY) * 0.9;

    setScale(fitScale);

    // Center the image
    setStagePos({
      x: (stageDimensions.width - imageSize.width * fitScale) / 2,
      y: (stageDimensions.height - imageSize.height * fitScale) / 2,
    });
  };

  // Handle calibration modal submit
  const handleCalibrationSubmit = useCallback((realDistanceMeters: number, scaleValue?: string, applyToAll?: boolean) => {
    if (!calibrationData) return;

    const { point1, point2, pixelDistance } = calibrationData;

    // Send calibration to backend
    const payload = {
      scale: scaleValue || undefined,
      referenceDistancePixels: pixelDistance,
      referenceDistanceMeters: realDistanceMeters,
      calibrationData: {
        x1: point1.x,
        y1: point1.y,
        x2: point2.x,
        y2: point2.y,
        realDistanceMeters,
      },
    };

    if (applyToAll) {
      // Apply to all pages
      metrageApi.calibrateAllPages(blueprintId, payload)
        .then((updatedPages) => {
          const newPixelsPerMeter = pixelDistance / realDistanceMeters;
          showToast.success(`Calibration appliquée à ${updatedPages.length} page(s) ! Échelle: ${newPixelsPerMeter.toFixed(2)} pixels/mètre`);
          onCalibrationComplete?.(newPixelsPerMeter, true);
        })
        .catch((error) => {
          showToast.error(error.message || 'Erreur lors de la calibration');
        });
    } else {
      // Apply to current page only
      metrageApi.calibratePage(pageId, payload)
        .then((updatedPage) => {
          // Convert to number in case backend returns string
          const newPixelsPerMeter = updatedPage.pixelsPerMeter
            ? Number(updatedPage.pixelsPerMeter)
            : (pixelDistance / realDistanceMeters);
          showToast.success(`Plan calibré ! Échelle: ${newPixelsPerMeter.toFixed(2)} pixels/mètre`);
          onCalibrationComplete?.(newPixelsPerMeter, false);
        })
        .catch((error) => {
          showToast.error(error.message || 'Erreur lors de la calibration');
        });
    }

    // Reset calibration data
    setCalibrationData(null);
  }, [calibrationData, pageId, blueprintId, onCalibrationComplete]);

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMeasurements(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setMeasurements(history[newIndex]);
    }
  }, [history, historyIndex]);

  const canUndo = useCallback(() => historyIndex > 0, [historyIndex]);
  const canRedo = useCallback(() => historyIndex < history.length - 1, [historyIndex, history.length]);

  // Counting mode functions
  const startCountingMode = useCallback(() => {
    setIsCountingMode(true);
    setCountingPoints([]);
  }, []);

  const stopCountingMode = useCallback(() => {
    // Show confirmation dialog
    setShowStopDialog(true);
  }, []);

  const cancelCountingMode = useCallback(() => {
    // Show confirmation dialog
    setShowCancelDialog(true);
  }, []);

  const confirmStopCounting = useCallback(() => {
    // Send each point as individual measurement in a loop
    if (countingPoints.length > 0) {
      const itemName = countingItemData?.itemName || 'Item';
      const itemColor = countingItemData?.color || '#10B981';
      countingPoints.forEach((point, index) => {
        const newMeasurement: Measurement = {
          id: Date.now().toString() + Math.random() + index,
          type: 'count',
          points: [point], // Single point per measurement
          color: itemColor,
          value: 1, // Each point counts as 1
          unit: 'u',
          label: `#${index + 1} ${itemName}`,
        };
        onMeasurementCreate?.(newMeasurement);
      });
    }
    setIsCountingMode(false);
    setCountingPoints([]);
    setShowStopDialog(false);
    // Reset tool to select
    onToolChange?.('select');
  }, [countingPoints, countingItemData, onMeasurementCreate, onToolChange]);

  const confirmCancelCounting = useCallback(() => {
    setIsCountingMode(false);
    setCountingPoints([]);
    setShowCancelDialog(false);
    // Reset tool to select to prevent reopening the modal
    onToolChange?.('select');
  }, [onToolChange]);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    fitToScreen: handleFitToScreen,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    startCountingMode,
    stopCountingMode,
    cancelCountingMode,
  }));

  // Handle double click - complete polygon
  const handleDoubleClick = useCallback(() => {
    if (activeTool === 'surface' || activeTool === 'polygon' || activeTool === 'volume') {
      if (currentPoints.length >= 3) {
        console.log('Double-click detected! Completing polygon with', currentPoints.length, 'points');

        const area = calculatePolygonArea(currentPoints);
        const newMeasurement: Measurement = {
          id: Date.now().toString(),
          type: activeTool,
          points: [...currentPoints],
          color: activeTool === 'volume' ? '#8B00FF' : '#0088FF',
          value: parseFloat(area.toFixed(2)),
          unit: 'm²',
          label: activeTool === 'volume' ? `${area.toFixed(2)} m²` : `${area.toFixed(2)} m²`,
        };

        // Only call the callback, don't add to history (parent handles that)
        onMeasurementCreate?.(newMeasurement);

        // Clean up
        setCurrentPoints([]);
        setPreviewPoint(null);
        setIsDrawing(false);
      }
    }
  }, [activeTool, currentPoints, onMeasurementCreate]);

  // Render measurements
  const renderMeasurement = (measurement: Measurement) => {
    const isHovered = hoveredMeasurement === measurement.id;
    const isHighlighted = highlightedMeasurementId === measurement.id || highlightedMeasurementIds.includes(measurement.id);
    const isShaking = shakingMeasurementId === measurement.id;
    const isActive = isHovered || isHighlighted;

    // Enhanced effect for highlighted from list
    const strokeWidth = isHighlighted ? 8 : isHovered ? 6 : 4;
    const opacity = isActive ? 1 : 0.8;
    const shadowOpacity = isHighlighted ? 0.3 : 0.15;

    // Apply shake offset if this measurement is shaking
    const applyShake = (point: Point): Point => {
      if (isShaking) {
        const shakenPoint = {
          x: point.x + shakeOffset.x,
          y: point.y + shakeOffset.y,
        };
        return shakenPoint;
      }
      return point;
    };

    if (measurement.type === 'distance') {
      // Handle both simple lines (2 points) and polylines/curves (multiple points)
      const isPolyline = measurement.points.length > 2;
      const pointRadius = isHighlighted ? 8 : isHovered ? 7 : 6;
      const innerPointRadius = isHighlighted ? 6 : isHovered ? 5 : 4;

      if (isPolyline) {
        // Render polyline/curve (multiple segments)
        const pointsWithShake = measurement.points.map(p => applyShake(p));
        const flatPoints = pointsWithShake.flatMap(p => [p.x, p.y]);

        return (
          <React.Fragment key={measurement.id}>
            {/* Shadow */}
            <Line
              points={flatPoints}
              stroke="#000000"
              strokeWidth={strokeWidth + 3}
              opacity={shadowOpacity}
              offsetY={3}
              offsetX={3}
              lineCap="round"
              lineJoin="round"
            />
            {/* Glow effect when highlighted */}
            {isHighlighted && (
              <Line
                points={flatPoints}
                stroke={measurement.color}
                strokeWidth={strokeWidth + 4}
                opacity={0.3}
                lineCap="round"
                lineJoin="round"
                shadowBlur={10}
                shadowColor={measurement.color}
              />
            )}
            {/* Main polyline */}
            <Line
              points={flatPoints}
              stroke={measurement.color}
              strokeWidth={strokeWidth}
              opacity={opacity}
              lineCap="round"
              lineJoin="round"
              onMouseEnter={() => setHoveredMeasurement(measurement.id)}
              onMouseLeave={() => setHoveredMeasurement(null)}
            />
            {/* End points */}
            {pointsWithShake.map((p, idx) => (
              <React.Fragment key={idx}>
                <Circle x={p.x} y={p.y} radius={pointRadius} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
                <Circle x={p.x} y={p.y} radius={innerPointRadius} fill={measurement.color} />
              </React.Fragment>
            ))}
            {measurement.label && (
              <Text
                x={pointsWithShake[Math.floor(pointsWithShake.length / 2)].x}
                y={pointsWithShake[Math.floor(pointsWithShake.length / 2)].y - (isHighlighted ? 20 : 15)}
                text={measurement.label}
                fontSize={isHighlighted ? 16 : 14}
                fill={measurement.color}
                fontStyle="bold"
                shadowBlur={isHighlighted ? 5 : 0}
                shadowColor={isHighlighted ? measurement.color : undefined}
              />
            )}
          </React.Fragment>
        );
      } else {
        // Simple line (2 points)
        const [p1Raw, p2Raw] = measurement.points;
        const p1 = applyShake(p1Raw);
        const p2 = applyShake(p2Raw);

        return (
          <React.Fragment key={measurement.id}>
            {/* Shadow for depth - more pronounced when highlighted */}
            <Line
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke="#000000"
              strokeWidth={strokeWidth + 3}
              opacity={shadowOpacity}
              offsetY={3}
              offsetX={3}
            />
            {/* Glow effect when highlighted */}
            {isHighlighted && (
              <Line
                points={[p1.x, p1.y, p2.x, p2.y]}
                stroke={measurement.color}
                strokeWidth={strokeWidth + 4}
                opacity={0.3}
                lineCap="round"
                lineJoin="round"
                shadowBlur={10}
                shadowColor={measurement.color}
              />
            )}
            {/* Main line */}
            <Line
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke={measurement.color}
              strokeWidth={strokeWidth}
              opacity={opacity}
              lineCap="round"
              lineJoin="round"
              onMouseEnter={() => setHoveredMeasurement(measurement.id)}
              onMouseLeave={() => setHoveredMeasurement(null)}
            />
            {/* End points with white border - larger when highlighted */}
            <Circle x={p1.x} y={p1.y} radius={pointRadius} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
            <Circle x={p1.x} y={p1.y} radius={innerPointRadius} fill={measurement.color} />
            <Circle x={p2.x} y={p2.y} radius={pointRadius} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
            <Circle x={p2.x} y={p2.y} radius={innerPointRadius} fill={measurement.color} />
            {measurement.label && (
              <Text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 - (isHighlighted ? 20 : 15)}
                text={measurement.label}
                fontSize={isHighlighted ? 16 : 14}
                fill={measurement.color}
                fontStyle="bold"
                shadowBlur={isHighlighted ? 5 : 0}
                shadowColor={isHighlighted ? measurement.color : undefined}
              />
            )}
          </React.Fragment>
        );
      }
    } else if (measurement.type === 'surface' || measurement.type === 'polygon' || measurement.type === 'volume') {
      const shakenPoints = measurement.points.map(applyShake);
      const flatPoints = shakenPoints.flatMap((p) => [p.x, p.y]);
      const centroid = {
        x: shakenPoints.reduce((sum, p) => sum + p.x, 0) / shakenPoints.length,
        y: shakenPoints.reduce((sum, p) => sum + p.y, 0) / shakenPoints.length,
      };
      const pointRadius = isHighlighted ? 8 : isHovered ? 7 : 6;
      const innerPointRadius = isHighlighted ? 6 : isHovered ? 5 : 4;
      const fillOpacity = isHighlighted ? 0.35 : 0.2;

      return (
        <React.Fragment key={measurement.id}>
          {/* Glow effect when highlighted */}
          {isHighlighted && (
            <Line
              points={flatPoints}
              stroke={measurement.color}
              strokeWidth={strokeWidth + 4}
              fill={measurement.color}
              fillOpacity={0.1}
              opacity={0.4}
              closed
              lineCap="round"
              lineJoin="round"
              shadowBlur={15}
              shadowColor={measurement.color}
            />
          )}
          <Line
            points={flatPoints}
            stroke={measurement.color}
            strokeWidth={strokeWidth}
            fill={measurement.color}
            fillOpacity={fillOpacity}
            opacity={opacity}
            closed
            lineCap="round"
            lineJoin="round"
            onMouseEnter={() => setHoveredMeasurement(measurement.id)}
            onMouseLeave={() => setHoveredMeasurement(null)}
          />
          {shakenPoints.map((p, i) => (
            <React.Fragment key={i}>
              <Circle x={p.x} y={p.y} radius={pointRadius} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
              <Circle x={p.x} y={p.y} radius={innerPointRadius} fill={measurement.color} />
            </React.Fragment>
          ))}
          {measurement.label && (
            <Text
              x={centroid.x}
              y={centroid.y}
              text={measurement.label}
              fontSize={isHighlighted ? 16 : 14}
              fill={measurement.color}
              fontStyle="bold"
              align="center"
              offsetX={measurement.label.length * (isHighlighted ? 4 : 3.5)}
              shadowBlur={isHighlighted ? 5 : 0}
              shadowColor={isHighlighted ? measurement.color : undefined}
            />
          )}
        </React.Fragment>
      );
    } else if (measurement.type === 'angle') {
      // Render angle measurement (3 points: p1, vertex, p2)
      if (measurement.points.length !== 3) return null;

      const [p1Raw, vertexRaw, p2Raw] = measurement.points;
      const p1 = applyShake(p1Raw);
      const vertex = applyShake(vertexRaw);
      const p2 = applyShake(p2Raw);

      const pointRadius = isHighlighted ? 8 : isHovered ? 7 : 6;
      const innerPointRadius = isHighlighted ? 6 : isHovered ? 5 : 4;

      return (
        <React.Fragment key={measurement.id}>
          {/* Shadow */}
          <Line
            points={[vertex.x, vertex.y, p1.x, p1.y]}
            stroke="#000000"
            strokeWidth={strokeWidth + 2}
            opacity={shadowOpacity}
            offsetY={2}
            offsetX={2}
            lineCap="round"
          />
          <Line
            points={[vertex.x, vertex.y, p2.x, p2.y]}
            stroke="#000000"
            strokeWidth={strokeWidth + 2}
            opacity={shadowOpacity}
            offsetY={2}
            offsetX={2}
            lineCap="round"
          />

          {/* Glow effect when highlighted */}
          {isHighlighted && (
            <>
              <Line
                points={[vertex.x, vertex.y, p1.x, p1.y]}
                stroke={measurement.color}
                strokeWidth={strokeWidth + 3}
                opacity={0.3}
                lineCap="round"
                shadowBlur={10}
                shadowColor={measurement.color}
              />
              <Line
                points={[vertex.x, vertex.y, p2.x, p2.y]}
                stroke={measurement.color}
                strokeWidth={strokeWidth + 3}
                opacity={0.3}
                lineCap="round"
                shadowBlur={10}
                shadowColor={measurement.color}
              />
            </>
          )}

          {/* Main angle lines */}
          <Line
            points={[vertex.x, vertex.y, p1.x, p1.y]}
            stroke={measurement.color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            lineCap="round"
            onMouseEnter={() => setHoveredMeasurement(measurement.id)}
            onMouseLeave={() => setHoveredMeasurement(null)}
          />
          <Line
            points={[vertex.x, vertex.y, p2.x, p2.y]}
            stroke={measurement.color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            lineCap="round"
            onMouseEnter={() => setHoveredMeasurement(measurement.id)}
            onMouseLeave={() => setHoveredMeasurement(null)}
          />

          {/* Points */}
          <Circle x={p1.x} y={p1.y} radius={pointRadius} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
          <Circle x={p1.x} y={p1.y} radius={innerPointRadius} fill={measurement.color} />

          <Circle x={vertex.x} y={vertex.y} radius={pointRadius + 2} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
          <Circle x={vertex.x} y={vertex.y} radius={innerPointRadius + 2} fill={measurement.color} />

          <Circle x={p2.x} y={p2.y} radius={pointRadius} fill="white" stroke={measurement.color} strokeWidth={isHighlighted ? 3 : 2} />
          <Circle x={p2.x} y={p2.y} radius={innerPointRadius} fill={measurement.color} />

          {/* Angle label */}
          {measurement.label && (
            <Text
              x={vertex.x}
              y={vertex.y - (isHighlighted ? 30 : 25)}
              text={measurement.label}
              fontSize={isHighlighted ? 20 : 18}
              fill={measurement.color}
              fontStyle="bold"
              align="center"
              offsetX={measurement.label.length * (isHighlighted ? 5 : 4.5)}
              shadowBlur={isHighlighted ? 5 : 0}
              shadowColor={isHighlighted ? measurement.color : undefined}
              stroke="white"
              strokeWidth={3}
              fillAfterStrokeEnabled
            />
          )}
        </React.Fragment>
      );
    } else if (measurement.type === 'count') {
      // Render counting point (single point per measurement)
      const pRaw = measurement.points[0];
      const p = applyShake(pRaw);
      const radius = isHighlighted ? 85 : isHovered ? 80 : 60;
      const strokeW = isHighlighted ? 6 : 5;

      // Extract index from label (format: "#1 ItemName")
      let indexNumber = '';
      let itemName = '';
      if (measurement.label) {
        const match = measurement.label.match(/^#(\d+)\s+(.+)$/);
        if (match) {
          indexNumber = match[1];
          itemName = match[2];
        } else {
          indexNumber = '1';
          itemName = measurement.label;
        }
      } else {
        indexNumber = '1';
      }

      return (
        <React.Fragment key={measurement.id}>
          {/* Glow effect when highlighted */}
          {isHighlighted && (
            <Circle
              x={p.x}
              y={p.y}
              radius={radius + 8}
              fill={measurement.color}
              opacity={0.2}
              shadowBlur={15}
              shadowColor={measurement.color}
            />
          )}
          {/* Hollow circle */}
          <Circle
            x={p.x}
            y={p.y}
            radius={radius}
            stroke={measurement.color}
            strokeWidth={strokeW}
            fill={measurement.color}
            opacity={0.1}
            onMouseEnter={() => setHoveredMeasurement(measurement.id)}
            onMouseLeave={() => setHoveredMeasurement(null)}
          />
          {/* Number inside circle */}
          <Text
            x={p.x}
            y={p.y - 10}
            text={indexNumber}
            fontSize={isHighlighted ? 48 : 42}
            fontStyle="bold"
            fill={measurement.color}
            align="center"
            width={160}
            offsetX={80}
          />
          {/* Item name below circle (only when highlighted or hovered) */}
          {(isHighlighted || isHovered) && itemName && (
            <Text
              x={p.x}
              y={p.y + radius + 10}
              text={itemName}
              fontSize={14}
              fontStyle="bold"
              fill={measurement.color}
              align="center"
              width={200}
              offsetX={100}
              stroke="white"
              strokeWidth={3}
              fillAfterStrokeEnabled
            />
          )}
        </React.Fragment>
      );
    }
    return null;
  };

  // Render current drawing preview
  const renderCurrentDrawing = () => {
    if (!isDrawing || currentPoints.length === 0) return null;

    if (activeTool === 'calibrate' && currentPoints.length >= 1) {
      const [p1] = currentPoints;
      const p2 = previewPoint;
      return (
        <>
          {/* Shadow/outline for better visibility */}
          {p2 && (
            <Line
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke="#000000"
              strokeWidth={10}
              opacity={0.2}
            />
          )}
          {/* Main calibration line - thick and solid */}
          {p2 && (
            <Line
              points={[p1.x, p1.y, p2.x, p2.y]}
              stroke="#FFA500"
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {/* Endpoint circles with white border */}
          <Circle x={p1.x} y={p1.y} radius={10} fill="white" stroke="#FFA500" strokeWidth={3} />
          <Circle x={p1.x} y={p1.y} radius={6} fill="#FFA500" />
          {p2 && (
            <>
              <Circle x={p2.x} y={p2.y} radius={10} fill="white" stroke="#FFA500" strokeWidth={3} />
              <Circle x={p2.x} y={p2.y} radius={6} fill="#FFA500" />
            </>
          )}
        </>
      );
    } else if (activeTool === 'distance' && currentPoints.length >= 1 && previewPoint) {
      const [p1] = currentPoints;
      const p2 = previewPoint;
      const distance = calculateDistance(p1, p2);
      return (
        <>
          {/* Shadow */}
          <Line
            points={[p1.x, p1.y, p2.x, p2.y]}
            stroke="#000000"
            strokeWidth={6}
            opacity={0.15}
            offsetY={2}
            offsetX={2}
          />
          {/* Main preview line */}
          <Line
            points={[p1.x, p1.y, p2.x, p2.y]}
            stroke="#FF0000"
            strokeWidth={4}
            dash={[8, 4]}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
          {/* End points */}
          <Circle x={p1.x} y={p1.y} radius={6} fill="white" stroke="#FF0000" strokeWidth={2} />
          <Circle x={p1.x} y={p1.y} radius={4} fill="#FF0000" />
          <Circle x={p2.x} y={p2.y} radius={6} fill="white" stroke="#FF0000" strokeWidth={2} />
          <Circle x={p2.x} y={p2.y} radius={4} fill="#FF0000" />
          {/* Label */}
          <Text
            x={(p1.x + p2.x) / 2}
            y={(p1.y + p2.y) / 2 - 20}
            text={`${distance.toFixed(2)} ml`}
            fontSize={16}
            fill="#FF0000"
            fontStyle="bold"
            stroke="white"
            strokeWidth={3}
            fillAfterStrokeEnabled
          />
        </>
      );
    } else if ((activeTool === 'surface' || activeTool === 'polygon' || activeTool === 'volume') && currentPoints.length >= 1) {
      // Include preview point to show the line following the cursor
      const pointsToShow = previewPoint
        ? [...currentPoints, previewPoint]
        : currentPoints;
      const flatPoints = pointsToShow.flatMap((p) => [p.x, p.y]);

      return (
        <>
          {/* Main preview line */}
          {pointsToShow.length >= 2 && (
            <Line
              points={flatPoints}
              stroke="#0088FF"
              strokeWidth={4}
              dash={[8, 4]}
              opacity={0.8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Closing line preview (from last point to first point) */}
          {currentPoints.length >= 3 && previewPoint && (
            <Line
              points={[previewPoint.x, previewPoint.y, currentPoints[0].x, currentPoints[0].y]}
              stroke="#0088FF"
              strokeWidth={3}
              dash={[4, 4]}
              opacity={0.5}
              lineCap="round"
            />
          )}

          {/* Points */}
          {currentPoints.map((p, i) => (
            <React.Fragment key={i}>
              <Circle x={p.x} y={p.y} radius={6} fill="white" stroke="#0088FF" strokeWidth={2} />
              <Circle x={p.x} y={p.y} radius={4} fill="#0088FF" />
            </React.Fragment>
          ))}

          {/* Preview point (cursor position) */}
          {previewPoint && (
            <>
              <Circle x={previewPoint.x} y={previewPoint.y} radius={5} fill="white" stroke="#0088FF" strokeWidth={2} opacity={0.6} />
              <Circle x={previewPoint.x} y={previewPoint.y} radius={3} fill="#0088FF" opacity={0.6} />
            </>
          )}
        </>
      );
    } else if (activeTool === 'curve' && currentPoints.length >= 1) {
      // Curve (polyline) preview - similar to polygon but no closing line
      const pointsToShow = previewPoint ? [...currentPoints, previewPoint] : currentPoints;
      const flatPoints = pointsToShow.flatMap((p) => [p.x, p.y]);

      return (
        <>
          {/* Main preview line */}
          {pointsToShow.length >= 2 && (
            <Line
              points={flatPoints}
              stroke="#00BFFF"
              strokeWidth={4}
              dash={[8, 4]}
              opacity={0.8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Points */}
          {currentPoints.map((p, i) => (
            <React.Fragment key={i}>
              <Circle x={p.x} y={p.y} radius={6} fill="white" stroke="#00BFFF" strokeWidth={2} />
              <Circle x={p.x} y={p.y} radius={4} fill="#00BFFF" />
            </React.Fragment>
          ))}

          {/* Preview point */}
          {previewPoint && (
            <>
              <Circle x={previewPoint.x} y={previewPoint.y} radius={5} fill="white" stroke="#00BFFF" strokeWidth={2} opacity={0.6} />
              <Circle x={previewPoint.x} y={previewPoint.y} radius={3} fill="#00BFFF" opacity={0.6} />
            </>
          )}
        </>
      );
    } else if (activeTool === 'angle' && currentPoints.length > 0) {
      // Angle measurement preview
      const pointsToShow = previewPoint && currentPoints.length < 3 ? [...currentPoints, previewPoint] : currentPoints;

      return (
        <>
          {/* Lines from vertex to other points */}
          {pointsToShow.length >= 2 && (
            <Line
              points={[pointsToShow[1].x, pointsToShow[1].y, pointsToShow[0].x, pointsToShow[0].y]}
              stroke="#FF00FF"
              strokeWidth={3}
              dash={[6, 3]}
              opacity={0.8}
              lineCap="round"
            />
          )}
          {pointsToShow.length === 3 && (
            <Line
              points={[pointsToShow[1].x, pointsToShow[1].y, pointsToShow[2].x, pointsToShow[2].y]}
              stroke="#FF00FF"
              strokeWidth={3}
              dash={[6, 3]}
              opacity={0.8}
              lineCap="round"
            />
          )}

          {/* Points */}
          {currentPoints.map((p, i) => (
            <React.Fragment key={i}>
              <Circle x={p.x} y={p.y} radius={i === 1 ? 8 : 6} fill="white" stroke="#FF00FF" strokeWidth={2} />
              <Circle x={p.x} y={p.y} radius={i === 1 ? 6 : 4} fill="#FF00FF" />
            </React.Fragment>
          ))}

          {/* Preview point */}
          {previewPoint && currentPoints.length < 3 && (
            <>
              <Circle x={previewPoint.x} y={previewPoint.y} radius={5} fill="white" stroke="#FF00FF" strokeWidth={2} opacity={0.6} />
              <Circle x={previewPoint.x} y={previewPoint.y} radius={3} fill="#FF00FF" opacity={0.6} />
            </>
          )}

          {/* Show angle value if 3 points selected */}
          {pointsToShow.length === 3 && (
            <Text
              x={pointsToShow[1].x}
              y={pointsToShow[1].y - 25}
              text={`${calculateAngle(pointsToShow[0], pointsToShow[1], pointsToShow[2]).toFixed(1)}°`}
              fontSize={18}
              fill="#FF00FF"
              fontStyle="bold"
              stroke="white"
              strokeWidth={3}
              fillAfterStrokeEnabled
            />
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-100 relative">
      {!isCalibrated && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 max-w-md">
          <div className="bg-orange-50 border-2 border-orange-300 text-orange-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Plan non calibré</p>
                <p className="text-xs mb-2">
                  {activeTool === 'calibrate'
                    ? 'Tracez une ligne entre deux points de distance connue'
                    : 'Sélectionnez l\'outil "Calibrage" dans la toolbar pour définir l\'échelle'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {stageDimensions.width === 0 || stageDimensions.height === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Initialisation du canvas...</p>
          </div>
        </div>
      ) : (
        <Stage
          ref={stageRef}
          width={stageDimensions.width}
          height={stageDimensions.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDblClick={handleDoubleClick}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={scale}
          scaleY={scale}
          draggable={false}
          className={isPanning ? 'cursor-grabbing' : activeTool === 'select' ? 'cursor-grab' : 'cursor-crosshair'}
        >
          <Layer>
            <PlanImage src={imageUrl} onLoad={handleImageLoad} />
          </Layer>
          <Layer>
            {measurements.map((m) => {
              // Show all measurements if visible, otherwise only show highlighted ones
              if (measurementsVisible) {
                return renderMeasurement(m);
              } else {
                // Only render if this measurement is highlighted
                const isHighlighted = highlightedMeasurementId === m.id || highlightedMeasurementIds.includes(m.id);
                return isHighlighted ? renderMeasurement(m) : null;
              }
            })}
            {renderCurrentDrawing()}

            {/* Counting mode points */}
            {isCountingMode && countingPoints.map((p, index) => {
              const countingColor = countingItemData?.color || '#10B981';

              return (
                <React.Fragment key={index}>
                  {/* Hollow circle - 60px radius */}
                  <Circle
                    x={p.x}
                    y={p.y}
                    radius={60}
                    stroke={countingColor}
                    strokeWidth={5}
                    fill={countingColor}
                    opacity={0.1}
                  />
                  {/* Index number */}
                  <Text
                    x={p.x}
                    y={p.y - 20}
                    text={`${index + 1}`}
                    fontSize={64}
                    fontStyle="bold"
                    fill={countingColor}
                    align="center"
                    width={160}
                    offsetX={80}
                  />
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      )}

      {/* Fallback if image doesn't load */}
      {imageSize.width === 0 && stageDimensions.width > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-700">Chargement de l'image...</p>
          </div>
        </div>
      )}

      {/* Counting mode controls */}
      {isCountingMode && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔢</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm">Mode Comptage</div>
                <div className="text-blue-100 text-xs">Cliquez pour ajouter des éléments</div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-6 flex items-center gap-3">
              <button
                onClick={cancelCountingMode}
                className=" px-4 py-1 bg-white border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:border-red-400 transition-all shadow-md"
              >
                Annuler
              </button>
              <button
                onClick={stopCountingMode}
                disabled={countingPoints.length === 0}
                className="flex  px-4 py-1.5 bg-blue-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Terminer ({countingPoints.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {isDrawing && !isCountingMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border-2 border-primary px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {activeTool === 'calibrate' && (
            <span>
              {currentPoints.length === 0 && '1️⃣ Cliquez sur le premier point'}
              {currentPoints.length === 1 && '2️⃣ Cliquez sur le deuxième point'}
            </span>
          )}
          {activeTool === 'distance' && 'Cliquez sur le deuxième point'}
          {(activeTool === 'surface' || activeTool === 'polygon') &&
            'Cliquez pour ajouter des points, double-cliquez pour terminer'}
        </div>
      )}

      {/* Cancel Counting Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Annuler le comptage ?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Voulez-vous vraiment annuler le comptage ? Les {countingPoints.length} élément{countingPoints.length !== 1 ? 's' : ''} compté{countingPoints.length !== 1 ? 's' : ''} seront perdus.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Non, continuer
              </button>
              <button
                onClick={confirmCancelCounting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Counting Confirmation Dialog */}
      {showStopDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Enregistrer le comptage ?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Voulez-vous enregistrer les {countingPoints.length} élément{countingPoints.length !== 1 ? 's' : ''} compté{countingPoints.length !== 1 ? 's' : ''} ? Chaque point sera sauvegardé individuellement.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowStopDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={confirmStopCounting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => {
          setIsCalibrationModalOpen(false);
          setCalibrationData(null);
        }}
        onSubmit={handleCalibrationSubmit}
        pixelDistance={calibrationData?.pixelDistance || 0}
        showApplyToAll={hasOtherPages}
      />
    </div>
  );
});

MetrageCanvas.displayName = 'MetrageCanvas';

export default React.memo(MetrageCanvas);
