'use client';

import { motion } from 'framer-motion';
import { Project, ProjectStatus } from '@/types/project';
import {
  Calendar,
  DollarSign,
  User,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onView: (project: Project) => void;
  onChangeStatus?: (project: Project, status: ProjectStatus) => void;
  onUpdateProgress?: (project: Project, progress: number) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  [ProjectStatus.PLANNING]: {
    label: 'Planification',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  [ProjectStatus.IN_PROGRESS]: {
    label: 'En cours',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  [ProjectStatus.ON_HOLD]: {
    label: 'En pause',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
  },
  [ProjectStatus.DELAYED]: {
    label: 'Retardé',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
  },
  [ProjectStatus.COMPLETED]: {
    label: 'Terminé',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
  },
  [ProjectStatus.CANCELLED]: {
    label: 'Annulé',
    color: 'text-gray-700',
    bgColor: 'bg-gray-200 border-gray-300',
  },
};

export default function ProjectCard({ project, onEdit, onDelete, onView, onChangeStatus, onUpdateProgress }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showStatusList, setShowStatusList] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressValue, setProgressValue] = useState(project.progress);
  const menuRef = useRef<HTMLDivElement>(null);

  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG[ProjectStatus.PLANNING];

  // Tous les statuts disponibles
  const allStatuses = Object.entries(STATUS_CONFIG).filter(
    ([status]) => status !== project.status
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowStatusList(false);
        setShowProgressForm(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset progress value when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      setProgressValue(project.progress);
    }
  }, [isMenuOpen, project.progress]);

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    } catch {
      return 'Date invalide';
    }
  };

  const formatBudget = (budget: string, currency: string) => {
    const amount = parseFloat(budget);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = () => {
    return 'bg-blue-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onView(project)}
    >
      {/* Header with Status Badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500">{project.projectCode}</span>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}>
                {config.label}
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {project.title}
            </h3>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 transition-all ${
                  showProgressForm ? 'w-72' : 'w-60'
                }`}
              >
                {!showStatusList && !showProgressForm ? (
                  // Menu principal
                  <>
                    <button
                      onClick={() => {
                        onView(project);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Eye className="w-4 h-4" />
                      Voir détails
                    </button>
                    <button
                      onClick={() => {
                        onEdit(project);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>

                    {/* Change Status Button */}
                    {onChangeStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStatusList(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-4 h-4" />
                          Changer le statut
                        </div>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Update Progress Button */}
                    {onUpdateProgress && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProgressForm(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4" />
                          Modifier la progression
                        </div>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}

                    <div className="border-t border-gray-100 my-2" />
                    <button
                      onClick={() => {
                        onDelete(project);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </>
                ) : showStatusList ? (
                  // Liste des statuts
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusList(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Retour
                    </button>
                    {allStatuses.map(([status, statusConfig]) => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus?.(project, status as ProjectStatus);
                          setIsMenuOpen(false);
                          setShowStatusList(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                      >
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color.replace('text-', 'bg-')}`} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  // Formulaire de progression
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProgressForm(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Retour
                    </button>
                    <div className="px-5 py-4 space-y-4">
                      {/* Header avec progression */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-gray-900">Progression</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">{progressValue}</span>
                          <span className="text-sm font-medium text-gray-500">%</span>
                        </div>
                      </div>

                      {/* Slider avec style amélioré */}
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressValue}
                          onChange={(e) => setProgressValue(parseInt(e.target.value))}
                          className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary slider-thumb"
                          style={{
                            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${progressValue}%, #e5e7eb ${progressValue}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>

                      {/* Boutons rapides avec meilleur style */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Valeurs rapides</p>
                        <div className="grid grid-cols-5 gap-2">
                          {[0, 25, 50, 75, 100].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProgressValue(value);
                              }}
                              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                progressValue === value
                                  ? 'bg-primary text-white shadow-md scale-105'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                              }`}
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bouton de validation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateProgress?.(project, progressValue);
                          setIsMenuOpen(false);
                          setShowProgressForm(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-primary-hover hover:to-blue-700 transition-all shadow-md hover:shadow-lg cursor-pointer"
                      >
                        Valider la progression
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Avancement</span>
            <span className="text-xs font-semibold text-gray-900">{project.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-2">
        {/* Budget */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 bg-green-50 rounded-md flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-green-600" />
          </div>
          <span className="text-gray-900 font-medium text-xs">
            {formatBudget(project.budget, project.currency)}
          </span>
        </div>

        {/* Project Manager */}
        {project.projectManager && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-gray-700 text-xs truncate">
              {project.projectManager.firstName} {project.projectManager.lastName}
            </span>
          </div>
        )}

        {/* Location */}
        {project.country && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-gray-700 text-xs">{project.country}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <span className="text-gray-600 text-xs">
            {new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            {' - '}
            {new Date(project.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Créé {formatDate(project.createdAt)}</span>
          {project.sitesCount !== undefined && (
            <span className="text-gray-700 font-medium">
              {project.sitesCount} chantier{project.sitesCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
