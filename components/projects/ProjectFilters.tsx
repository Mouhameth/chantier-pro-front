'use client';

import { ProjectFilters as IProjectFilters, ProjectType, ProjectStatus } from '@/types/project';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ProjectFiltersProps {
  filters: IProjectFilters;
  onFilterChange: (filters: IProjectFilters) => void;
}

const PROJECT_TYPES = [
  // 🏠 Bâtiment
  { value: ProjectType.RESIDENTIAL_CONSTRUCTION, label: 'Construction Résidentielle' },
  { value: ProjectType.COMMERCIAL_CONSTRUCTION, label: 'Construction Commerciale' },
  { value: ProjectType.INDUSTRIAL_CONSTRUCTION, label: 'Construction Industrielle' },
  { value: ProjectType.INSTITUTIONAL_CONSTRUCTION, label: 'Construction Institutionnelle' },
  { value: ProjectType.MIXED_USE_CONSTRUCTION, label: 'Construction à Usage Mixte' },

  // 🔨 Rénovation & réhabilitation
  { value: ProjectType.RENOVATION, label: 'Rénovation' },
  { value: ProjectType.REHABILITATION, label: 'Réhabilitation' },
  { value: ProjectType.RESTORATION, label: 'Restauration' },
  { value: ProjectType.REFURBISHMENT, label: 'Remise à Niveau' },

  // 🛣️ Infrastructures & génie civil
  { value: ProjectType.ROAD_CONSTRUCTION, label: 'Construction Routière' },
  { value: ProjectType.BRIDGE_CONSTRUCTION, label: 'Construction de Pont' },
  { value: ProjectType.TUNNEL_CONSTRUCTION, label: 'Construction de Tunnel' },
  { value: ProjectType.RAILWAY_CONSTRUCTION, label: 'Construction Ferroviaire' },
  { value: ProjectType.AIRPORT_INFRASTRUCTURE, label: 'Infrastructure Aéroportuaire' },
  { value: ProjectType.PORT_INFRASTRUCTURE, label: 'Infrastructure Portuaire' },
  { value: ProjectType.DAM_CONSTRUCTION, label: 'Construction de Barrage' },

  // 🌍 VRD & réseaux
  { value: ProjectType.URBAN_DEVELOPMENT, label: 'Développement Urbain (VRD)' },
  { value: ProjectType.WATER_SUPPLY, label: 'Adduction d\'Eau' },
  { value: ProjectType.SEWERAGE, label: 'Assainissement' },
  { value: ProjectType.DRAINAGE, label: 'Drainage' },
  { value: ProjectType.POWER_DISTRIBUTION, label: 'Distribution Électrique' },
  { value: ProjectType.TELECOM_INFRASTRUCTURE, label: 'Infrastructure Télécom' },

  // ⚡ Énergie & environnement
  { value: ProjectType.POWER_PLANT, label: 'Centrale Électrique' },
  { value: ProjectType.RENEWABLE_ENERGY, label: 'Énergie Renouvelable' },
  { value: ProjectType.OIL_AND_GAS, label: 'Pétrole & Gaz' },
  { value: ProjectType.MINING_INFRASTRUCTURE, label: 'Infrastructure Minière' },

  // 🧱 Travaux spécialisés
  { value: ProjectType.EARTHWORKS, label: 'Terrassement' },
  { value: ProjectType.DEMOLITION, label: 'Démolition' },
  { value: ProjectType.STEEL_STRUCTURE, label: 'Charpente Métallique' },
  { value: ProjectType.CONCRETE_WORKS, label: 'Béton Armé' },
  { value: ProjectType.FINISHING_WORKS, label: 'Second Œuvre' },

  // 🏗️ Maintenance & exploitation
  { value: ProjectType.MAINTENANCE, label: 'Maintenance' },
  { value: ProjectType.FACILITY_MANAGEMENT, label: 'Gestion de Patrimoine' },

  // 📐 Études & conception
  { value: ProjectType.DESIGN, label: 'Conception Architecturale' },
  { value: ProjectType.ENGINEERING, label: 'Études Techniques' },
  { value: ProjectType.SURVEYING, label: 'Levés Topographiques' },

  // 🧪 Autres
  { value: ProjectType.TURNKEY_PROJECT, label: 'Projet Clé en Main' },
  { value: ProjectType.PPP_PROJECT, label: 'Partenariat Public-Privé' },
  { value: ProjectType.OTHER, label: 'Autre' },
];

const PROJECT_STATUSES = [
  { value: ProjectStatus.PLANNING, label: 'Planification' },
  { value: ProjectStatus.IN_PROGRESS, label: 'En cours' },
  { value: ProjectStatus.ON_HOLD, label: 'En pause' },
  { value: ProjectStatus.DELAYED, label: 'Retardé' },
  { value: ProjectStatus.COMPLETED, label: 'Terminé' },
  { value: ProjectStatus.CANCELLED, label: 'Annulé' },
];

export default function ProjectFilters({ filters, onFilterChange }: ProjectFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.status,
    filters.projectType,
    filters.country,
  ].filter(Boolean).length;

  const handleStatusChange = (status: ProjectStatus | undefined) => {
    onFilterChange({ ...filters, status, page: 1 });
  };

  const handleTypeChange = (projectType: ProjectType | undefined) => {
    onFilterChange({ ...filters, projectType, page: 1 });
  };

  const clearFilters = () => {
    onFilterChange({ page: 1, pageSize: filters.pageSize });
    setIsOpen(false);
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
          hasActiveFilters
            ? 'border-primary bg-primary text-white hover:bg-primary-hover'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filtres
        {activeFiltersCount > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            hasActiveFilters ? 'bg-white text-primary' : 'bg-primary text-white'
          }`}>
            {activeFiltersCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Filter Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-gray-900">Filtrer les projets</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange(undefined)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        !filters.status
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les statuts
                    </button>
                    {PROJECT_STATUSES.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.status === status.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de projet
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleTypeChange(undefined)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        !filters.projectType
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les types
                    </button>
                    {PROJECT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handleTypeChange(type.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.projectType === type.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              {hasActiveFilters && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
