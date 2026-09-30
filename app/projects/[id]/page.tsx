'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { projectsApi } from '@/lib/api/projects';
import { ProjectStatus } from '@/types/project';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Building2,
  Users,
  MapPin,
  Clock,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  [ProjectStatus.PLANNING]: { label: 'Planification', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  [ProjectStatus.IN_PROGRESS]: { label: 'En cours', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  [ProjectStatus.ON_HOLD]: { label: 'En pause', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' },
  [ProjectStatus.DELAYED]: { label: 'Retardé', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  [ProjectStatus.COMPLETED]: { label: 'Terminé', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  [ProjectStatus.CANCELLED]: { label: 'Annulé', color: 'text-gray-700', bgColor: 'bg-gray-200 border-gray-300' },
};

type Tab = 'informations' | 'chantiers' | 'equipe' | 'finances';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  const [activeTab, setActiveTab] = useState<Tab>('informations');

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId,
  });
  console.log(project);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Chargement du projet...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Projet introuvable</h3>
            <p className="text-gray-600 mb-4">Le projet demandé n'existe pas ou a été supprimé</p>
            <Button variant="primary" onClick={() => router.push('/projects')}>
              Retour aux projets
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status];

  const calculateDuration = () => {
    if (!project.startDate || !project.endDate) return 'N/A';
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return months > 0 ? `${months} mois ${remainingDays} jours` : `${days} jours`;
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

  const tabs = [
    { id: 'informations' as Tab, label: 'Informations', icon: FileText },
    { id: 'chantiers' as Tab, label: 'Chantiers', icon: Building2 },
    { id: 'equipe' as Tab, label: 'Équipe', icon: Users },
    { id: 'finances' as Tab, label: 'Finances', icon: DollarSign },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-5"
      >
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Header du projet */}
        <Card padding="sm">
          <div className="space-y-2">
            {/* Première ligne: Code, Titre, Statut */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-gray-500">{project.projectCode}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </div>
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-1">{project.title}</h1>
                {project.clientReference && (
                  <p className="text-sm text-gray-600">Réf. client: {project.clientReference}</p>
                )}
              </div>
            </div>

            {/* Deuxième ligne: Avancement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Avancement</span>
                </div>
                <span className="text-xl font-bold text-primary">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Troisième ligne: Chef de projet et dates */}
            <div className="flex items-center gap-6 text-sm text-gray-600 pt-1 ">
              {project.projectManager && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {project.projectManager.firstName} {project.projectManager.lastName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(project.startDate).toLocaleDateString('fr-FR')} →{' '}
                  {new Date(project.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 1: Vue synthèse (Stats Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Durée */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="w-8 h-8 bg-blue-50 rounded-sm flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Durée</p>
              <p className="text-sm font-bold text-gray-900">{calculateDuration()}</p>
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="w-8 h-8 bg-green-50 rounded-sm flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Budget</p>
              <p className="text-sm font-bold text-gray-900">{formatBudget(project.budget, project.currency)}</p>
            </div>
          </div>

          {/* Chantiers */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="w-8 h-8 bg-orange-50 rounded-sm flex items-center justify-center">
              <Building2 className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Chantiers</p>
              <p className="text-sm font-bold text-gray-900">{project.sitesCount || 0}</p>
            </div>
          </div>

          {/* Sous-traitants */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="w-8 h-8 bg-purple-50 rounded-sm flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Sous-traitants</p>
              <p className="text-sm font-bold text-gray-900">0</p>
            </div>
          </div>

          {/* Pays */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="w-8 h-8 bg-pink-50 rounded-sm flex items-center justify-center">
              <MapPin className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pays</p>
              <p className="text-sm font-bold text-gray-900">{project.country || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Onglets */}
        <Card >
          {/* Tabs Header */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tabs Content */}
          <div className="p-6">
            {activeTab === 'informations' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <p className="text-gray-900">{project.description || 'Aucune description'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type de projet</label>
                      <p className="text-gray-900">{project.projectType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Référence client</label>
                      <p className="text-gray-900">{project.clientReference || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                      <p className="text-gray-900">{project.currency}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'chantiers' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun chantier</h3>
                <p className="text-gray-600 mb-6">Ce projet n'a pas encore de chantier rattaché</p>
                <Button variant="primary">
                  <Building2 className="w-4 h-4 mr-2" />
                  Ajouter un chantier
                </Button>
              </motion.div>
            )}

            {activeTab === 'equipe' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chef de projet</h3>
                  {project.projectManager ? (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {project.projectManager.firstName[0]}
                        {project.projectManager.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {project.projectManager.firstName} {project.projectManager.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{project.projectManager.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">Aucun chef de projet assigné</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sous-traitants</h3>
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun sous-traitant pour le moment</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'finances' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card padding="md">
                    <p className="text-sm text-gray-600 mb-2">Budget total</p>
                    <p className="text-2xl font-bold text-gray-900">{formatBudget(project.budget, project.currency)}</p>
                  </Card>
                  <Card padding="md">
                    <p className="text-sm text-gray-600 mb-2">Dépenses</p>
                    <p className="text-2xl font-bold text-orange-600">0 {project.currency}</p>
                  </Card>
                  <Card padding="md">
                    <p className="text-sm text-gray-600 mb-2">Écart</p>
                    <p className="text-2xl font-bold text-green-600">{formatBudget(project.budget, project.currency)}</p>
                  </Card>
                </div>

                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Fonctionnalité finances en développement</p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
