export enum ProjectType {
  // 🏠 Bâtiment
  RESIDENTIAL_CONSTRUCTION = 'RESIDENTIAL_CONSTRUCTION',      // Maisons, immeubles résidentiels
  COMMERCIAL_CONSTRUCTION = 'COMMERCIAL_CONSTRUCTION',        // Bureaux, commerces, hôtels
  INDUSTRIAL_CONSTRUCTION = 'INDUSTRIAL_CONSTRUCTION',        // Usines, entrepôts, zones industrielles
  INSTITUTIONAL_CONSTRUCTION = 'INSTITUTIONAL_CONSTRUCTION',  // Écoles, hôpitaux, bâtiments publics
  MIXED_USE_CONSTRUCTION = 'MIXED_USE_CONSTRUCTION',          // Usage mixte (logement + commerce)

  // 🔨 Rénovation & réhabilitation
  RENOVATION = 'RENOVATION',                                  // Rénovation classique
  REHABILITATION = 'REHABILITATION',                          // Réhabilitation lourde
  RESTORATION = 'RESTORATION',                                // Bâtiments historiques
  REFURBISHMENT = 'REFURBISHMENT',                            // Remise à niveau / modernisation

  // 🛣️ Infrastructures & génie civil
  ROAD_CONSTRUCTION = 'ROAD_CONSTRUCTION',                    // Routes, autoroutes
  BRIDGE_CONSTRUCTION = 'BRIDGE_CONSTRUCTION',                // Ponts
  TUNNEL_CONSTRUCTION = 'TUNNEL_CONSTRUCTION',                // Tunnels
  RAILWAY_CONSTRUCTION = 'RAILWAY_CONSTRUCTION',              // Voies ferrées
  AIRPORT_INFRASTRUCTURE = 'AIRPORT_INFRASTRUCTURE',          // Aéroports
  PORT_INFRASTRUCTURE = 'PORT_INFRASTRUCTURE',                // Ports
  DAM_CONSTRUCTION = 'DAM_CONSTRUCTION',                      // Barrages

  // 🌍 VRD & réseaux
  URBAN_DEVELOPMENT = 'URBAN_DEVELOPMENT',                    // VRD, lotissements
  WATER_SUPPLY = 'WATER_SUPPLY',                              // Adduction d'eau
  SEWERAGE = 'SEWERAGE',                                      // Assainissement
  DRAINAGE = 'DRAINAGE',                                      // Drainage
  POWER_DISTRIBUTION = 'POWER_DISTRIBUTION',                  // Réseaux électriques
  TELECOM_INFRASTRUCTURE = 'TELECOM_INFRASTRUCTURE',          // Fibre, télécoms

  // ⚡ Énergie & environnement
  POWER_PLANT = 'POWER_PLANT',                                // Centrales électriques
  RENEWABLE_ENERGY = 'RENEWABLE_ENERGY',                      // Solaire, éolien
  OIL_AND_GAS = 'OIL_AND_GAS',                                // Projets pétroliers et gaziers
  MINING_INFRASTRUCTURE = 'MINING_INFRASTRUCTURE',            // Mines

  // 🧱 Travaux spécialisés
  EARTHWORKS = 'EARTHWORKS',                                  // Terrassement
  DEMOLITION = 'DEMOLITION',                                  // Démolition
  STEEL_STRUCTURE = 'STEEL_STRUCTURE',                        // Charpente métallique
  CONCRETE_WORKS = 'CONCRETE_WORKS',                          // Béton armé
  FINISHING_WORKS = 'FINISHING_WORKS',                        // Second œuvre

  // 🏗️ Maintenance & exploitation
  MAINTENANCE = 'MAINTENANCE',                                // Maintenance
  FACILITY_MANAGEMENT = 'FACILITY_MANAGEMENT',                // Gestion de patrimoine

  // 📐 Études & conception
  DESIGN = 'DESIGN',                                          // Conception architecturale
  ENGINEERING = 'ENGINEERING',                                // Études techniques
  SURVEYING = 'SURVEYING',                                    // Levés topographiques

  // 🧪 Autres
  TURNKEY_PROJECT = 'TURNKEY_PROJECT',                        // Clé en main
  PPP_PROJECT = 'PPP_PROJECT',                                // Partenariat public-privé
  OTHER = 'OTHER',                                            // Autres cas
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface ProjectManager {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
}

export interface Project {
  id: number;
  projectCode: string;
  title: string;
  description?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  progress: number;
  clientReference?: string;
  country?: string;
  address?: string;
  startDate: string;
  endDate: string;
  budget: string;
  currency: string;
  projectManager?: ProjectManager;
  projectManagerId?: number;
  sitesCount?: number;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateProjectData {
  id: number; 
  title: string;
  description?: string;
  projectType: ProjectType;
  clientReference?: string;
  country?: string;
  address?: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  projectManagerId: number;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  projectType?: ProjectType;
  country?: string;
  projectManagerId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectsListResponse {
  data: Project[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}
