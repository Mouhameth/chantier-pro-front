'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import ProjectModal from '@/components/projects/ProjectModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { projectsApi } from '@/lib/api/projects';
import { Project, ProjectFilters as IProjectFilters, CreateProjectData, ProjectStatus } from '@/types/project';
import { showToast } from '@/lib/utils/toast';
import { Plus, FolderOpen, Loader2, AlertCircle, Search, X } from 'lucide-react';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters, setFilters] = useState<IProjectFilters>({ page: 1, pageSize: 12 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', { page: filters.page, pageSize: filters.pageSize }],
    queryFn: () => projectsApi.list({ page: filters.page, pageSize: filters.pageSize }),
  });

  const filteredProjects = data?.data.filter((project) => {
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      const title = project.title.toLowerCase();
      const code = project.projectCode.toLowerCase();
      const clientRef = project.clientReference?.toLowerCase() || '';
      const matchesSearch = title.includes(searchLower) || code.includes(searchLower) || clientRef.includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (filters.status && project.status !== filters.status) return false;
    if (filters.projectType && project.projectType !== filters.projectType) return false;
    if (filters.country && project.country !== filters.country) return false;
    return true;
  }) || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.create(data),
    onSuccess: () => {
      showToast.success('Projet créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setSelectedProject(null);
    },
    onError: (error: Error) => showToast.error(error.message || 'Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ data }: { data: Partial<CreateProjectData> }) => projectsApi.update( data),
    onSuccess: () => {
      showToast.success('Projet modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setSelectedProject(null);
    },
    onError: (error: Error) => showToast.error(error.message || 'Erreur lors de la modification'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      showToast.success('Projet supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectToDelete(null);
    },
    onError: (error: Error) => showToast.error(error.message || 'Erreur lors de la suppression'),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProjectStatus }) =>
      projectsApi.changeStatus(id, status),
    onSuccess: () => {
      showToast.success('Statut du projet mis à jour');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors du changement de statut');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) =>
      projectsApi.updateProgress(id, progress),
    onSuccess: () => {
      showToast.success('Progression mise à jour');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de la mise à jour de la progression');
    },
  });

  const handleCreateProject = () => { setSelectedProject(null); setIsModalOpen(true); };
  const handleEditProject = (project: Project) => { console.log(project);
   setSelectedProject(project); setIsModalOpen(true); };
  const handleViewProject = (project: Project) => router.push(`/projects/${project.id}`);
  const handleSubmit = async (data: CreateProjectData) => {
    if (selectedProject) await updateMutation.mutateAsync({ data });
    else await createMutation.mutateAsync(data);
  };
  const handleDeleteProject = (project: Project) => setProjectToDelete(project);
  const handleChangeStatus = (project: Project, status: ProjectStatus) => {
    changeStatusMutation.mutate({ id: project.id, status });
  };
  const handleUpdateProgress = (project: Project, progress: number) => {
    updateProgressMutation.mutate({ id: project.id, progress });
  };
  const confirmDelete = () => { if (projectToDelete) deleteMutation.mutate(projectToDelete.id); };
  const handlePageChange = (page: number) => setFilters((prev) => ({ ...prev, page }));
  const handlePageSizeChange = (pageSize: number) => setFilters((prev) => ({ ...prev, pageSize, page: 1 }));

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des projets</h1>
                <p className="text-gray-600 mt-1">{data?.pagination.total || 0} projet(s) au total</p>
              </div>
            </div>
            <Button variant="primary" size="md" onClick={handleCreateProject}>
              <Plus className="w-4 h-4 mr-2" />Nouveau projet
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><Search className="w-5 h-5 text-gray-400" /></div>
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par titre, code, référence client..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors" />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <ProjectFilters filters={filters} onFilterChange={setFilters} />
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
              <p className="text-gray-600 font-medium">Chargement des projets...</p>
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
              <Button variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}>Réessayer</Button>
            </div>
          </div>
        ) : !data?.data.length ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun projet trouvé</h3>
              <p className="text-gray-600 mb-6">Commencez par créer votre premier projet</p>
              <Button variant="primary" onClick={handleCreateProject}><Plus className="w-4 h-4 mr-2" />Créer un projet</Button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-600 mb-6">Aucun projet ne correspond à votre recherche "{searchInput}"</p>
              <Button variant="ghost" onClick={() => setSearchInput('')}><X className="w-4 h-4 mr-2" />Effacer la recherche</Button>
            </div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onView={handleViewProject}
                  onChangeStatus={handleChangeStatus}
                  onUpdateProgress={handleUpdateProgress}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <ProjectModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProject(null); }}
        onSubmit={handleSubmit} project={selectedProject} isLoading={createMutation.isPending || updateMutation.isPending} />

      <ConfirmDialog isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={confirmDelete}
        title="Supprimer le projet" message={`Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete?.title}" ? Cette action est irréversible.`}
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
