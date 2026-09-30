import { Site } from "./site";

export enum OuvrageCategory {
  // Gros œuvre
  MUR = 'MUR', // Murs porteurs
  DALLE = 'DALLE', // Dalles béton
  CLOISON = 'CLOISON', // Cloisons
  OUVERTURE = 'OUVERTURE', // Portes, fenêtres
  FONDATION = 'FONDATION', // Fondations
  CHARPENTE = 'CHARPENTE', // Charpente
  COUVERTURE = 'COUVERTURE', // Toiture

  // Réseaux
  RESEAU_EAU = 'RESEAU_EAU', // Réseaux eau potable
  RESEAU_ELEC = 'RESEAU_ELEC', // Réseaux électrique
  RESEAU_ASSAIN = 'RESEAU_ASSAIN', // Assainissement
  RESEAU_GAZ = 'RESEAU_GAZ', // Gaz
  RESEAU_TELECOM = 'RESEAU_TELECOM', // Télécoms

  // Second œuvre
  PEINTURE = 'PEINTURE', // Peinture
  CARRELAGE = 'CARRELAGE', // Carrelage
  REVETEMENT_SOL = 'REVETEMENT_SOL', // Revêtement de sol
  REVETEMENT_MUR = 'REVETEMENT_MUR', // Revêtement mural
  FAUX_PLAFOND = 'FAUX_PLAFOND', // Faux plafonds
  MENUISERIE = 'MENUISERIE', // Menuiserie bois
  METALLERIE = 'METALLERIE', // Serrurerie métallerie

  // Corps d'état techniques
  PLOMBERIE = 'PLOMBERIE', // Plomberie
  ELECTRICITE = 'ELECTRICITE', // Électricité
  CHAUFFAGE = 'CHAUFFAGE', // Chauffage
  CLIMATISATION = 'CLIMATISATION', // Climatisation
  VENTILATION = 'VENTILATION', // VMC, ventilation

  // Autres
  TERRASSEMENT = 'TERRASSEMENT', // Terrassement
  VRD = 'VRD', // Voirie et réseaux divers
  ESPACES_VERTS = 'ESPACES_VERTS', // Aménagements paysagers
  AUTRE = 'AUTRE', // Autres ouvrages
}

export enum MetrageType {
  LINE = 'LINE', // Longueur linéaire (ml)
  POLYGON = 'POLYGON', // Surface (m²)
  VOLUME = 'VOLUME', // Volume (m³)
  POINT = 'POINT', // Comptage (unité)
  POLYLINE = 'POLYLINE', // Ligne brisée (ml)
}

export enum PageStatus {
  PENDING = 'PENDING', // Aucun métrage
  IN_PROGRESS = 'IN_PROGRESS', // Au moins 1 métrage
  COMPLETED = 'COMPLETED', // Terminé (manuel)
  VALIDATED = 'VALIDATED', // Validé (manuel)
}

export interface BlueprintPage {
  id: number;
  blueprintId: number;
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  scale?: string;
  pixelsPerMeter?: number;
  isCalibrated: boolean;
  calibrationData?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    realDistanceMeters: number;
  };
  status: PageStatus;
  width: number;
  height: number;
  title?: string;
  orientation?: string;
  metrages?: Metrage[];
  createdAt: string;
  updatedAt: string;
}

export interface Metrage {
  id: number;
  pageId: number;
  type: MetrageType;
  ouvrageCategory: OuvrageCategory;
  geometry: any; // JSON geometry data
  quantity: number;
  unit: string;
  height?: number;
  color: string;
  strokeWidth: number;
  opacity: number;
  label?: string;
  comment?: string;
  isLocked: boolean;
  lockedBy?: number;
  lockedAt?: string;
  version: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Blueprint {
  id: number;
  site: Site;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  totalPages: number;
  title?: string;
  description?: string;
  pages?: BlueprintPage[];
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlueprintData {
  siteId: number;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  totalPages: number;
  title?: string;
  description?: string;
}

export interface BlueprintFilters {
  siteId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BlueprintsListResponse {
  data: Blueprint[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Labels pour l'affichage
export const OuvrageCategoryLabels: Record<OuvrageCategory, string> = {
  [OuvrageCategory.MUR]: 'Murs porteurs',
  [OuvrageCategory.DALLE]: 'Dalles béton',
  [OuvrageCategory.CLOISON]: 'Cloisons',
  [OuvrageCategory.OUVERTURE]: 'Portes et fenêtres',
  [OuvrageCategory.FONDATION]: 'Fondations',
  [OuvrageCategory.CHARPENTE]: 'Charpente',
  [OuvrageCategory.COUVERTURE]: 'Toiture',
  [OuvrageCategory.RESEAU_EAU]: 'Réseau eau potable',
  [OuvrageCategory.RESEAU_ELEC]: 'Réseau électrique',
  [OuvrageCategory.RESEAU_ASSAIN]: 'Assainissement',
  [OuvrageCategory.RESEAU_GAZ]: 'Gaz',
  [OuvrageCategory.RESEAU_TELECOM]: 'Télécoms',
  [OuvrageCategory.PEINTURE]: 'Peinture',
  [OuvrageCategory.CARRELAGE]: 'Carrelage',
  [OuvrageCategory.REVETEMENT_SOL]: 'Revêtement de sol',
  [OuvrageCategory.REVETEMENT_MUR]: 'Revêtement mural',
  [OuvrageCategory.FAUX_PLAFOND]: 'Faux plafonds',
  [OuvrageCategory.MENUISERIE]: 'Menuiserie bois',
  [OuvrageCategory.METALLERIE]: 'Serrurerie métallerie',
  [OuvrageCategory.PLOMBERIE]: 'Plomberie',
  [OuvrageCategory.ELECTRICITE]: 'Électricité',
  [OuvrageCategory.CHAUFFAGE]: 'Chauffage',
  [OuvrageCategory.CLIMATISATION]: 'Climatisation',
  [OuvrageCategory.VENTILATION]: 'VMC, ventilation',
  [OuvrageCategory.TERRASSEMENT]: 'Terrassement',
  [OuvrageCategory.VRD]: 'Voirie et réseaux divers',
  [OuvrageCategory.ESPACES_VERTS]: 'Aménagements paysagers',
  [OuvrageCategory.AUTRE]: 'Autres ouvrages',
};

export const MetrageTypeLabels: Record<MetrageType, string> = {
  [MetrageType.LINE]: 'Longueur (ml)',
  [MetrageType.POLYGON]: 'Surface (m²)',
  [MetrageType.VOLUME]: 'Volume (m³)',
  [MetrageType.POINT]: 'Comptage (u)',
  [MetrageType.POLYLINE]: 'Ligne brisée (ml)',
};
