export enum SiteStatus {
  NOT_STARTED = 'NOT_STARTED',  // Pas encore démarré
  IN_PROGRESS = 'IN_PROGRESS',  // En cours
  ON_HOLD = 'ON_HOLD',          // En pause / Suspendu
  DELAYED = 'DELAYED',          // Retardé
  COMPLETED = 'COMPLETED',      // Terminé
  CANCELLED = 'CANCELLED',      // Annulé
}

export interface Site {
  id: number;
  name: string;
  description?: string;
  address: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: SiteStatus;
  projectId: number;
  project?: {
    id: number;
    projectCode: string;
    title: string;
    status: string;
  };
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateSiteData {
  name: string;
  description?: string;
  address: string;
  startDate: string;
  endDate: string;
  progress?: number;
  status?: SiteStatus;
  projectId: number;
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  id: number;
}

export interface SiteFilters {
  status?: SiteStatus;
  projectId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SitesListResponse {
  data: Site[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}
