'use client';

import { UserRole, UserFilters as IUserFilters } from '@/types/auth';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface UserFiltersProps {
  filters: IUserFilters;
  onFilterChange: (filters: IUserFilters) => void;
}

const creatableRoles = [
  { value: UserRole.ADMIN, label: 'Administrateur' },
  { value: UserRole.PROJECT_MANAGER, label: 'Chef de Projet' },
  { value: UserRole.ACCOUNTANT, label: 'Comptable' },
  { value: UserRole.SUPERVISOR, label: 'Superviseur' },
  { value: UserRole.ARCHITECT, label: 'Architecte' },
  { value: UserRole.TECHNICIAN, label: 'Technicien' },
];

export default function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [filters.role, filters.isActive !== undefined].filter(Boolean).length;

  const handleRoleChange = (role: UserRole | undefined) => {
    onFilterChange({ ...filters, role, page: 1 });
  };

  const handleStatusChange = (isActive: boolean | undefined) => {
    onFilterChange({ ...filters, isActive, page: 1 });
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
                <h3 className="font-semibold text-gray-900">Filtrer les utilisateurs</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleRoleChange(undefined)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        !filters.role
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les rôles
                    </button>
                    {creatableRoles.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => handleRoleChange(role.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.role === role.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange(undefined)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.isActive === undefined
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les statuts
                    </button>
                    <button
                      onClick={() => handleStatusChange(true)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.isActive === true
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Actif
                    </button>
                    <button
                      onClick={() => handleStatusChange(false)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.isActive === false
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Inactif
                    </button>
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
