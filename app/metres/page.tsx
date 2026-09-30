'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BlueprintUploadModal from '@/components/blueprints/BlueprintUploadModal';
import { blueprintsApi } from '@/lib/api/blueprints';
import { sitesApi } from '@/lib/api/sites';
import { showToast } from '@/lib/utils/toast';
import {
  Plus,
  Ruler,
  Loader2,
  AlertCircle,
  FileImage,
  Eye,
  Download,
  Trash2,
  Calendar,
  FileText,
  Search,
  X,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Blueprint } from '@/types/blueprint';

export default function MetresPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch blueprints
  const { data: blueprints, isLoading, error } = useQuery({
    queryKey: ['blueprints'],
    queryFn: () => blueprintsApi.list(),
  });

  // Fetch sites for the upload modal
  const { data: sitesData } = useQuery({
    queryKey: ['sites', { pageSize: 100 }],
    queryFn: () => sitesApi.list({ pageSize: 100 }),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, siteId, title, description }: {
      file: File;
      siteId: number;
      title?: string;
      description?: string;
    }) => {
      return await blueprintsApi.upload(file, siteId, title, description);
    },
    onSuccess: () => {
      showToast.success('Plan uploadé avec succès');
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      setIsUploadModalOpen(false);
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de l\'upload');
    },
  });

  const handleUpload = async (file: File, data: { siteId: number; title?: string; description?: string }) => {
    await uploadMutation.mutateAsync({ file, ...data });
  };

  const handleViewBlueprint = (blueprint: Blueprint) => {
    // Navigate to blueprint viewer (to be implemented)
    router.push(`/metres/${blueprint.id}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Filter blueprints based on search
  const filteredBlueprints = blueprints?.data.filter((blueprint) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      blueprint.title?.toLowerCase().includes(search) ||
      blueprint.filename.toLowerCase().includes(search) ||
      blueprint.description?.toLowerCase().includes(search)
    );
  });
console.log(filteredBlueprints);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion des métrés
                </h1>
                <p className="text-gray-600 mt-1">
                  {blueprints?.pagination.total || 0} plan{(blueprints?.pagination.total || 0) > 1 ? 's' : ''} disponible{(blueprints?.pagination.total || 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un plan
            </Button>
          </div>

          {/* Search bar */}
          {blueprints && blueprints.data.length > 0 && (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, nom de fichier ou description..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Chargement des plans...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">{(error as Error).message || 'Une erreur est survenue'}</p>
              <Button variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['blueprints'] })}>
                Réessayer
              </Button>
            </div>
          </div>
        ) : !blueprints?.data || blueprints.data.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ruler className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun plan disponible
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par uploader votre premier plan PDF pour démarrer les métrés
              </p>
              <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un plan
              </Button>
            </div>
          </Card>
        ) : filteredBlueprints && filteredBlueprints.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-600 mb-6">
                Aucun plan ne correspond à votre recherche "{searchQuery}"
              </p>
              <Button variant="ghost" onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 mr-2" />
                Effacer la recherche
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBlueprints?.map((blueprint) => (
                <motion.div
                  key={blueprint.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card hover className="overflow-hidden p-0">
                    {/* PDF Preview */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center overflow-hidden">
                      {blueprint.pages && blueprint.pages.length > 0 && blueprint.pages[0].thumbnailUrl ? (
                        <img
                          src={blueprint.pages[0].thumbnailUrl}
                          alt={blueprint.title || blueprint.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : blueprint.pages && blueprint.pages.length > 0 && blueprint.pages[0].imageUrl ? (
                        <img
                          src={blueprint.pages[0].imageUrl}
                          alt={blueprint.title || blueprint.filename}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FileImage className="w-16 h-16 text-purple-400" />
                      )}
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

                      {/* Site & Project info */}
                      {blueprint.site && (
                        <div className="mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 mt-0.5 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-2.5 h-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-blue-900 truncate">
                                  {blueprint.site.name}
                                </p>
                                <p className="text-xs text-blue-700 truncate">
                                  {blueprint.site.address}
                                </p>
                              </div>
                            </div>
                            {blueprint.site.project && (
                              <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-blue-600 font-mono">
                                  {blueprint.site.project.projectCode}
                                </span>
                                <span className="text-xs text-blue-500">•</span>
                                <span className="text-xs text-blue-600 truncate flex-1">
                                  {blueprint.site.project.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* File info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="font-mono truncate">{blueprint.filename}</span>
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
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewBlueprint(blueprint)}
                        >
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

                    {/* Stats footer */}
                    {blueprint.pages && blueprint.pages.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {blueprint.pages.filter((p) => p.isCalibrated).length} / {blueprint.pages.length} calibrées
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
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Upload Modal */}
      <BlueprintUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUpload}
        sites={sitesData?.data || []}
        isLoading={uploadMutation.isPending}
      />
    </DashboardLayout>
  );
}
