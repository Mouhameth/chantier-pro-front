import type { Point, Measurement } from '@/types/metrage';
import { MetrageType } from '@/types/metrage';

/**
 * Calculate distance between two points in pixels
 */
export function calculatePixelDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate total length of polyline in pixels
 */
export function calculatePolylineLength(points: Point[]): number {
  if (points.length < 2) return 0;

  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalLength += calculatePixelDistance(points[i], points[i + 1]);
  }
  return totalLength;
}

/**
 * Calculate polygon area using Shoelace formula
 * Returns area in square pixels
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Convert pixels to meters based on calibration
 */
export function pixelsToMeters(pixels: number, pixelsPerMeter: number): number {
  return pixels / pixelsPerMeter;
}

/**
 * Convert square pixels to square meters
 */
export function squarePixelsToSquareMeters(
  squarePixels: number,
  pixelsPerMeter: number
): number {
  return squarePixels / (pixelsPerMeter * pixelsPerMeter);
}

/**
 * Calculate quantity for a measurement based on its type
 */
export function calculateMeasurementQuantity(
  type: MetrageType,
  geometry: any,
  pixelsPerMeter: number,
  height?: number
): number {
  switch (type) {
    case MetrageType.LINE: {
      const points = geometry.points as [Point, Point];
      const pixelDistance = calculatePixelDistance(points[0], points[1]);
      return pixelsToMeters(pixelDistance, pixelsPerMeter);
    }

    case MetrageType.POLYLINE: {
      const points = geometry.points as Point[];
      const pixelLength = calculatePolylineLength(points);
      return pixelsToMeters(pixelLength, pixelsPerMeter);
    }

    case MetrageType.POLYGON: {
      const points = geometry.points as Point[];
      const squarePixels = calculatePolygonArea(points);
      return squarePixelsToSquareMeters(squarePixels, pixelsPerMeter);
    }

    case MetrageType.VOLUME: {
      const points = geometry.points as Point[];
      const squarePixels = calculatePolygonArea(points);
      const areaSquareMeters = squarePixelsToSquareMeters(squarePixels, pixelsPerMeter);
      return areaSquareMeters * (height || 1);
    }

    case MetrageType.POINT: {
      return 1; // Always 1 for point counting
    }

    default:
      return 0;
  }
}

/**
 * Get the center point of a geometry for label placement
 */
export function getGeometryCenter(type: MetrageType, geometry: any): Point {
  switch (type) {
    case MetrageType.LINE: {
      const points = geometry.points as [Point, Point];
      return {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      };
    }

    case MetrageType.POLYLINE:
    case MetrageType.POLYGON:
    case MetrageType.VOLUME: {
      const points = geometry.points as Point[];
      const sumX = points.reduce((sum, p) => sum + p.x, 0);
      const sumY = points.reduce((sum, p) => sum + p.y, 0);
      return {
        x: sumX / points.length,
        y: sumY / points.length,
      };
    }

    case MetrageType.POINT: {
      return { x: geometry.x, y: geometry.y };
    }

    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Get formatted label for measurement display
 */
export function formatMeasurementLabel(
  quantity: number,
  unit: string,
  label?: string
): string {
  const quantityStr = quantity.toFixed(2);
  const baseLabel = `${quantityStr} ${unit}`;
  return label ? `${label}\n${baseLabel}` : baseLabel;
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if a point is near a line
 */
export function isPointNearLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  threshold: number = 10
): boolean {
  const distanceToLine = pointToLineDistance(point, lineStart, lineEnd);
  return distanceToLine <= threshold;
}

/**
 * Calculate distance from point to line segment
 */
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a measurement is hovered/selected
 */
export function isMeasurementHovered(
  measurement: Measurement,
  mousePoint: Point,
  threshold: number = 10
): boolean {
  const { type, geometry } = measurement;

  switch (type) {
    case MetrageType.LINE: {
      const points = geometry.points as [Point, Point];
      return isPointNearLine(mousePoint, points[0], points[1], threshold);
    }

    case MetrageType.POLYLINE: {
      const points = geometry.points as Point[];
      for (let i = 0; i < points.length - 1; i++) {
        if (isPointNearLine(mousePoint, points[i], points[i + 1], threshold)) {
          return true;
        }
      }
      return false;
    }

    case MetrageType.POLYGON:
    case MetrageType.VOLUME: {
      const points = geometry.points as Point[];
      return isPointInPolygon(mousePoint, points);
    }

    case MetrageType.POINT: {
      const distance = calculatePixelDistance(mousePoint, {
        x: geometry.x,
        y: geometry.y,
      });
      return distance <= threshold;
    }

    default:
      return false;
  }
}
