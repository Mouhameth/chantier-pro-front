'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { sitesApi } from '@/lib/api/sites';
import { blueprintsApi } from '@/lib/api/blueprints';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  TrendingUp,
  Building2,
  FileText,
  Users,
  BarChart3,
  Map,
  Ruler,
  ClipboardList,
  Loader2,
  AlertCircle,
  Edit,
  Eye,
  Download,
  Trash2,
  Plus,
  FileImage,
} from 'lucide-react';

type TabType = 'details' | 'plans' | 'metrage' | 'devis' | 'planning' | 'equipe' | 'rapports';

const tabs = [
  { id: 'details', label: 'Détails', icon: Building2 },
  { id: 'plans', label: 'Plans', icon: Map },
  { id: 'metrage', label: 'Métrage', icon: Ruler },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'equipe', label: 'Équipe', icon: Users },
  { id: 'rapports', label: 'Rapports', icon: BarChart3 },
] as const;

const statusColors = {
  NOT_STARTED: 'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  ON_HOLD: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DELAYED: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
  NOT_STARTED: 'Pas démarré',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En pause',
  DELAYED: 'Retardé',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
} as const;

type SiteStatus = keyof typeof statusColors;

interface Site {
  id: number;
  name: string;
  address: string;
  description?: string;
  status: SiteStatus;
  progress: number;
  startDate: string;
  endDate: string;
  project?: {
    projectCode: string;
    title: string;
    status: string;
  };
}

export default function ChantierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabType>('details');

  const { data: site, isLoading, error } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => sitesApi.getById(siteId),
    enabled: !!siteId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Chargement du chantier...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !site) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chantier introuvable</h3>
            <p className="text-gray-600 mb-4">
              {(error as Error)?.message || 'Ce chantier n\'existe pas ou a été supprimé'}
            </p>
            <Button variant="primary" onClick={() => router.push('/chantiers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/chantiers')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux chantiers
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{site.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{site.address}</span>
                  </div>
                  {site.project && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>{site.project.projectCode} - {site.project.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  statusColors[site.status]
                }`}
              >
                {statusLabels[site.status]}
              </span>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Progression</p>
                <p className="text-2xl font-bold text-gray-900">{site.progress}%</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Date de début</p>
                <p className="text-lg font-bold text-gray-900">
                  {format(new Date(site.startDate), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Date de fin</p>
                <p className="text-lg font-bold text-gray-900">
                  {format(new Date(site.endDate), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Durée totale</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.ceil(
                    (new Date(site.endDate).getTime() - new Date(site.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  jours
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Card className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      relative flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                      transition-colors duration-200
                      ${
                        isActive
                          ? 'text-primary border-b-2 border-primary bg-primary/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </Card>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'details' && <DetailsTab site={site} />}
            {activeTab === 'plans' && <PlansTab site={site} />}
            {activeTab === 'metrage' && <MetrageTab site={site} />}
            {activeTab === 'devis' && <DevisTab site={site} />}
            {activeTab === 'planning' && <PlanningTab site={site} />}
            {activeTab === 'equipe' && <EquipeTab site={site} />}
            {activeTab === 'rapports' && <RapportsTab site={site} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}

// Tab Components
function DetailsTab({ site }: { site: Site }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Nom du chantier</label>
            <p className="text-gray-900 mt-1">{site.name}</p>
          </div>
          {site.description && (
            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-gray-900 mt-1">{site.description}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">Adresse</label>
            <p className="text-gray-900 mt-1">{site.address}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Statut</label>
            <p className="text-gray-900 mt-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${
                  statusColors[site.status]
                }`}
              >
                {statusLabels[site.status]}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Projet associé</h2>
        {site.project ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Code projet</label>
              <p className="text-gray-900 mt-1 font-mono">{site.project.projectCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Titre</label>
              <p className="text-gray-900 mt-1">{site.project.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Statut du projet</label>
              <p className="text-gray-900 mt-1">{site.project.status}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Aucun projet associé</p>
        )}
      </Card>

      <Card padding="lg" className="lg:col-span-2">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Progression</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avancement global</span>
              <span className="text-sm font-bold text-gray-900">{site.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500"
                style={{ width: `${site.progress}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Début</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(site.startDate), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fin prévue</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(site.endDate), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Jours restants</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(site.endDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}{' '}
                jours
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PlansTab({ site }: { site: any }) {
  return (
    <Card padding="lg">
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Map className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plans du chantier</h3>
        <p className="text-gray-600 mb-6">
          Visualisez et gérez tous les plans techniques de ce chantier
        </p>
        <Button variant="primary" size="md">
          <FileText className="w-4 h-4 mr-2" />
          Ajouter un plan
        </Button>
      </div>
    </Card>
  );
}

function MetrageTab({ site }: { site: Site }) {
  const { data: blueprints, isLoading, error } = useQuery({
    queryKey: ['blueprints', site.id],
    queryFn: () => blueprintsApi.getBySiteId(site.id),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Chargement des plans...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </Card>
    );
  }

  if (!blueprints || blueprints.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ruler className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun plan disponible</h3>
          <p className="text-gray-600 mb-6">
            Ajoutez des plans pour commencer le métrage de ce chantier
          </p>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un plan
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plans et Métrage</h2>
          <p className="text-gray-600 mt-1">
            {blueprints.length} plan{blueprints.length > 1 ? 's' : ''} disponible{blueprints.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un plan
        </Button>
      </div>

      {/* Blueprints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blueprints.map((blueprint) => (
          <motion.div
            key={blueprint.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card hover className="overflow-hidden p-0">
              {/* Thumbnail or File Icon */}
              <div className="relative h-48 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <FileImage className="w-16 h-16 text-purple-400" />
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
                    {blueprint.totalPages} page{blueprint.totalPages > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                  {blueprint.title || blueprint.filename}
                </h3>
                {blueprint.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {blueprint.description}
                  </p>
                )}

                {/* File info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-mono">{blueprint.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>{formatFileSize(blueprint.fileSize)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="uppercase">{blueprint.mimeType.split('/')[1]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Créé le {format(new Date(blueprint.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" className="flex-1">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Ouvrir
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Pages count badge */}
              {blueprint.pages && blueprint.pages.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {blueprint.pages.filter((p) => p.isCalibrated).length} / {blueprint.pages.length} pages calibrées
                    </span>
                    <span className="text-gray-600">
                      {blueprint.pages.reduce((acc, p) => acc + (p.metrages?.length || 0), 0)} métrages
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DevisTab({ site }: { site: any }) {
  return (
    <Card padding="lg">
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Devis</h3>
        <p className="text-gray-600 mb-6">
          Consultez et gérez les devis associés à ce chantier
        </p>
        <Button variant="primary" size="md">
          <FileText className="w-4 h-4 mr-2" />
          Créer un devis
        </Button>
      </div>
    </Card>
  );
}

function PlanningTab({ site }: { site: any }) {
  return (
    <Card padding="lg">
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Planning</h3>
        <p className="text-gray-600 mb-6">
          Organisez les tâches et suivez le planning de ce chantier
        </p>
        <Button variant="primary" size="md">
          <ClipboardList className="w-4 h-4 mr-2" />
          Créer une tâche
        </Button>
      </div>
    </Card>
  );
}

function EquipeTab({ site }: { site: any }) {
  return (
    <Card padding="lg">
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Équipe du chantier</h3>
        <p className="text-gray-600 mb-6">
          Gérez les membres de l'équipe affectés à ce chantier
        </p>
        <Button variant="primary" size="md">
          <Users className="w-4 h-4 mr-2" />
          Ajouter un membre
        </Button>
      </div>
    </Card>
  );
}

function RapportsTab({ site }: { site: any }) {
  return (
    <Card padding="lg">
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-10 h-10 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapports</h3>
        <p className="text-gray-600 mb-6">
          Consultez les rapports d'avancement et statistiques de ce chantier
        </p>
        <Button variant="primary" size="md">
          <FileText className="w-4 h-4 mr-2" />
          Générer un rapport
        </Button>
      </div>
    </Card>
  );
}
