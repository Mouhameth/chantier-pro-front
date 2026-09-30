import type { OuvrageCategory, OuvrageItem } from './ouvrage';

export enum MetrageType {
  LINE = 'LINE',
  POLYGON = 'POLYGON',
  VOLUME = 'VOLUME',
  POINT = 'POINT',
  POLYLINE = 'POLYLINE',
}

export interface Point {
  x: number;
  y: number;
}

export interface LineGeometry {
  points: [Point, Point];
}

export interface PolygonGeometry {
  points: Point[];
}

export interface PolylineGeometry {
  points: Point[];
}

export interface PointGeometry {
  x: number;
  y: number;
}

export type MeasurementGeometry =
  | LineGeometry
  | PolygonGeometry
  | PolylineGeometry
  | PointGeometry;

export interface Measurement {
  id: number;
  blueprintId: number;
  pageId: number;
  type: MetrageType;

  // Ouvrage links
  categoryId: number;
  category: OuvrageCategory;
  itemId: number;
  item: OuvrageItem;

  // Geometry and calculations
  geometry: MeasurementGeometry;
  quantity: string; // Decimal as string
  unit: string;
  unitPriceOverride?: number | null;
  height?: number | null; // For volumes

  // Visual properties
  color: string;
  strokeWidth: number;
  opacity: string; // Decimal 0-1
  label?: string | null;
  comment?: string | null;

  // Quote link
  quoteItemId?: number | null;
  quoteItem?: any | null;

  // Collaboration (Phase 3)
  sessionId?: number | null;
  session?: any | null;
  isLocked: boolean;
  lockedBy?: number | null;
  lockedByUser?: any | null;
  lockedAt?: string | null;

  // Versioning
  version: number;

  // Relations
  page: {
    id: number;
    pageNumber: number;
    blueprintId: number;
  };
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  // Timestamps
  createdBy: number;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateMeasurementData {
  type: MetrageType;
  categoryId: number;
  itemId: number;
  geometry: MeasurementGeometry;
  color: string;
  label?: string;
  comment?: string;
  height?: number;
  strokeWidth?: number;
  opacity?: number;
  unitPriceOverride?: number;
}

export interface UpdateMeasurementData {
  geometry?: MeasurementGeometry;
  color?: string;
  label?: string;
  comment?: string;
  height?: number;
  strokeWidth?: number;
  opacity?: number;
  unitPriceOverride?: number;
}

export interface MeasurementsListResponse {
  success: boolean;
  data: Measurement[];
  count: number;
}
