'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SiteCard from '@/components/sites/SiteCard';
import SiteModal from '@/components/sites/SiteModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { sitesApi } from '@/lib/api/sites';
import { projectsApi } from '@/lib/api/projects';
import { Site, SiteFilters as ISiteFilters, CreateSiteData, SiteStatus } from '@/types/site';
import { showToast } from '@/lib/utils/toast';
import { Plus, Building2, Loader2, AlertCircle, Search, X } from 'lucide-react';

export default function SitesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters, setFilters] = useState<ISiteFilters>({ page: 1, pageSize: 12 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['sites', { page: filters.page, pageSize: filters.pageSize, status: filters.status, projectId: filters.projectId }],
    queryFn: () => sitesApi.list({ page: filters.page, pageSize: filters.pageSize, status: filters.status, projectId: filters.projectId }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', { pageSize: 100 }],
    queryFn: () => projectsApi.list({ pageSize: 100 }),
  });

  const filteredSites = data?.data.filter((site) => {
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      const name = site.name.toLowerCase();
      const address = site.address.toLowerCase();
      const projectTitle = site.project?.title?.toLowerCase() || '';
      const projectCode = site.project?.projectCode?.toLowerCase() || '';
      const matchesSearch = name.includes(searchLower) || address.includes(searchLower) ||
                           projectTitle.includes(searchLower) || projectCode.includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  }) || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateSiteData) => sitesApi.create(data),
    onSuccess: () => {
      showToast.success('Chantier créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsModalOpen(false);
      setSelectedSite(null);
    },
    onError: (error: Error) => showToast.error(error.message || 'Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateSiteData & { id: number }) => sitesApi.update(data),
    onSuccess: () => {
      showToast.success('Chantier modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsModalOpen(false);
      setSelectedSite(null);
    },
    onError: (error: Error) => showToast.error(error.message || 'Erreur lors de la modification'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sitesApi.delete(id),
    onSuccess: () => {
      showToast.success('Chantier supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setSiteToDelete(null);
    },
    onError: (error: Error) => showToast.error(error.message || 'Erreur lors de la suppression'),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SiteStatus }) =>
      sitesApi.changeStatus(id, status),
    onSuccess: () => {
      showToast.success('Statut du chantier mis à jour');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors du changement de statut');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) =>
      sitesApi.updateProgress(id, progress),
    onSuccess: () => {
      showToast.success('Progression mise à jour');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de la mise à jour de la progression');
    },
  });

  const handleCreateSite = () => { setSelectedSite(null); setIsModalOpen(true); };
  const handleEditSite = (site: Site) => { setSelectedSite(site); setIsModalOpen(true); };
  const handleViewSite = (site: Site) => router.push(`/chantiers/${site.id}`);
  const handleSubmit = async (data: CreateSiteData) => {
    console.log(data);
    
    if (selectedSite) await updateMutation.mutateAsync({ ...data, id: selectedSite.id });
    else await createMutation.mutateAsync(data);
  };
  const handleDeleteSite = (site: Site) => setSiteToDelete(site);
  const handleChangeStatus = (site: Site, status: SiteStatus) => {
    changeStatusMutation.mutate({ id: site.id, status });
  };
  const handleUpdateProgress = (site: Site, progress: number) => {
    updateProgressMutation.mutate({ id: site.id, progress });
  };
  const confirmDelete = () => { if (siteToDelete) deleteMutation.mutate(siteToDelete.id); };
  const handlePageChange = (page: number) => setFilters((prev) => ({ ...prev, page }));
  const handlePageSizeChange = (pageSize: number) => setFilters((prev) => ({ ...prev, pageSize, page: 1 }));

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des chantiers</h1>
                <p className="text-gray-600 mt-1">{data?.pagination.total || 0} chantier(s) au total</p>
              </div>
            </div>
            <Button variant="primary" size="md" onClick={handleCreateSite}>
              <Plus className="w-4 h-4 mr-2" />Nouveau chantier
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Search className="w-5 h-5 text-gray-400" /></div>
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par nom, adresse, projet..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors" />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as SiteStatus || undefined, page: 1 }))}
                className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Tous les statuts</option>
                <option value={SiteStatus.NOT_STARTED}>Pas démarré</option>
                <option value={SiteStatus.IN_PROGRESS}>En cours</option>
                <option value={SiteStatus.ON_HOLD}>En pause</option>
                <option value={SiteStatus.DELAYED}>Retardé</option>
                <option value={SiteStatus.COMPLETED}>Terminé</option>
                <option value={SiteStatus.CANCELLED}>Annulé</option>
              </select>

              {/* Project Filter */}
              <select
                value={filters.projectId || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, projectId: e.target.value ? parseInt(e.target.value) : undefined, page: 1 }))}
                className="px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Tous les projets</option>
                {projectsData?.data.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectCode} - {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {data && data.pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">
                  Affichage {((filters.page || 1) - 1) * (filters.pageSize || 12) + 1} - {Math.min((filters.page || 1) * (filters.pageSize || 12), data.pagination.total)} sur {data.pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Éléments par page:</label>
                  <select value={filters.pageSize || 12} onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary transition-colors">
                    <option value={6}>6</option><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option>
                  </select>
                </div>
              </div>
              {data.pagination.totalPages > 1 && (
                <Pagination currentPage={data.pagination.page} totalPages={data.pagination.totalPages}
                  hasNext={data.pagination.hasNext || false} hasPrev={data.pagination.hasPrev || false} onPageChange={handlePageChange} />
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Chargement des chantiers...</p>
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
              <Button variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['sites'] })}>Réessayer</Button>
            </div>
          </div>
        ) : !data?.data.length ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun chantier trouvé</h3>
              <p className="text-gray-600 mb-6">Commencez par créer votre premier chantier</p>
              <Button variant="primary" onClick={handleCreateSite}><Plus className="w-4 h-4 mr-2" />Créer un chantier</Button>
            </div>
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-600 mb-6">Aucun chantier ne correspond à votre recherche "{searchInput}"</p>
              <Button variant="ghost" onClick={() => setSearchInput('')}><X className="w-4 h-4 mr-2" />Effacer la recherche</Button>
            </div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
            <AnimatePresence mode="popLayout">
              {filteredSites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onEdit={handleEditSite}
                  onDelete={handleDeleteSite}
                  onView={handleViewSite}
                  onChangeStatus={handleChangeStatus}
                  onUpdateProgress={handleUpdateProgress}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <SiteModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedSite(null); }}
        onSubmit={handleSubmit} site={selectedSite} isLoading={createMutation.isPending || updateMutation.isPending} />

      <ConfirmDialog isOpen={!!siteToDelete} onClose={() => setSiteToDelete(null)} onConfirm={confirmDelete}
        title="Supprimer le chantier" message={`Êtes-vous sûr de vouloir supprimer le chantier "${siteToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer" cancelText="Annuler" isLoading={deleteMutation.isPending} />

      {/* Loading overlay pendant le changement de statut */}
      {changeStatusMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Changement de statut en cours...</p>
              <p className="text-sm text-gray-600 mt-1">Veuillez patienter</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay pendant la mise à jour de progression */}
      {updateProgressMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Mise à jour de la progression...</p>
              <p className="text-sm text-gray-600 mt-1">Veuillez patienter</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
