import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import type { CreateProjectData, ProjectFilters, ProjectStatus } from '@/types/project';
import toast from 'react-hot-toast';

export const QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECT: (id: number) => ['project', id],
  PROJECT_MANAGERS: 'project-managers',
} as const;

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, filters],
    queryFn: () => projectsApi.list(filters),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.PROJECT(id),
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      toast.success('Projet créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création du projet');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateProjectData>) => projectsApi.update(data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT(updatedProject.id) });
      toast.success('Projet modifié avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la modification du projet');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      toast.success('Projet supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression du projet');
    },
  });
}

export function useChangeProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProjectStatus }) =>
      projectsApi.changeStatus(id, status),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECT(updatedProject.id) });
      toast.success('Statut du projet mis à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du changement de statut');
    },
  });
}

export function useProjectManagers() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROJECT_MANAGERS],
    queryFn: () => projectsApi.getProjectManagers(),
  });
}
