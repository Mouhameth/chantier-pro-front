import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { BlueprintPage, PageStatus } from '@/types/blueprint';
import type {
  Measurement,
  MeasurementsListResponse,
  CreateMeasurementData,
  UpdateMeasurementData,
} from '@/types/metrage';

interface CalibrationData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  realDistanceMeters: number;
}

interface CalibratePageRequest {
  scale?: string;
  referenceDistancePixels: number;
  referenceDistanceMeters: number;
  calibrationData: CalibrationData;
}

const METRAGE_ENDPOINTS = {
  CALIBRATE_PAGE: (pageId: number) => `/metrage/pages/${pageId}/calibrate`,
  COPY_CALIBRATION: (targetPageId: number, sourcePageId: number) =>
    `/metrage/pages/${targetPageId}/copy-calibration/${sourcePageId}`,
  CALIBRATE_ALL_PAGES: (blueprintId: number) => `/metrage/blueprints/${blueprintId}/calibrate-all`,

  // Page status
  UPDATE_PAGE_STATUS: (pageId: number) => `/metrage/pages/${pageId}/status`,

  // Measurements
  MEASUREMENTS: (pageId: number) => `/metrage/pages/${pageId}/measurements`,
  MEASUREMENT: (measurementId: number) => `/metrage/measurements/${measurementId}`,
} as const;

export const metrageApi = {
  // ===== CALIBRATION =====

  async calibratePage(pageId: number, data: CalibratePageRequest): Promise<BlueprintPage> {
    const response = await apiClient.patch<ApiResponse<BlueprintPage>>(
      METRAGE_ENDPOINTS.CALIBRATE_PAGE(pageId),
      data
    );
    return response.data!;
  },

  async copyCalibration(targetPageId: number, sourcePageId: number): Promise<BlueprintPage> {
    const response = await apiClient.post<ApiResponse<BlueprintPage>>(
      METRAGE_ENDPOINTS.COPY_CALIBRATION(targetPageId, sourcePageId),
      {}
    );
    return response.data!;
  },

  async calibrateAllPages(blueprintId: number, data: CalibratePageRequest): Promise<BlueprintPage[]> {
    const response = await apiClient.post<ApiResponse<BlueprintPage[]>>(
      METRAGE_ENDPOINTS.CALIBRATE_ALL_PAGES(blueprintId),
      data
    );
    return response.data!;
  },

  // ===== PAGE STATUS =====

  async updatePageStatus(pageId: number, status: PageStatus): Promise<BlueprintPage> {
    const response = await apiClient.patch<ApiResponse<BlueprintPage>>(
      METRAGE_ENDPOINTS.UPDATE_PAGE_STATUS(pageId),
      { status }
    );
    return response.data!;
  },

  // ===== MEASUREMENTS =====

  async listMeasurements(pageId: number): Promise<MeasurementsListResponse> {
    const response = await apiClient.get<MeasurementsListResponse>(
      METRAGE_ENDPOINTS.MEASUREMENTS(pageId)
    );
    return response;
  },

  async createMeasurement(pageId: number, data: CreateMeasurementData): Promise<Measurement> {
    const response = await apiClient.post<ApiResponse<Measurement>>(
      METRAGE_ENDPOINTS.MEASUREMENTS(pageId),
      data
    );
    return response.data!;
  },

  async updateMeasurement(measurementId: number, data: UpdateMeasurementData): Promise<Measurement> {
    const response = await apiClient.patch<ApiResponse<Measurement>>(
      METRAGE_ENDPOINTS.MEASUREMENT(measurementId),
      data
    );
    return response.data!;
  },

  async deleteMeasurement(measurementId: number): Promise<void> {
    await apiClient.delete(METRAGE_ENDPOINTS.MEASUREMENT(measurementId));
  },
};
