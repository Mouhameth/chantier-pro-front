'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/plans';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreatePlanData, UpdatePlanData } from '@/types/plan';
import { showToast } from '@/lib/utils/toast';

export function usePlans() {
  const queryClient = useQueryClient();

  // Fetch plans with stats
  const {
    data: plans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.PLANS],
    queryFn: () => plansApi.getPlansWithStats(),
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: CreatePlanData) => plansApi.createPlan(data),
    onSuccess: () => {
      showToast.success('Plan créé avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erreur lors de la création du plan';
      showToast.error(errorMessage);
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanData }) =>
      plansApi.updatePlan(id, data),
    onSuccess: () => {
      showToast.success('Plan mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erreur lors de la mise à jour du plan';
      showToast.error(errorMessage);
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => plansApi.deletePlan(id),
    onSuccess: () => {
      showToast.success('Plan supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PLANS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erreur lors de la suppression du plan';
      showToast.error(errorMessage);
    },
  });

  return {
    plans: plans || [],
    isLoading,
    error,
    refetch,
    createPlan: createPlanMutation.mutate,
    createPlanAsync: createPlanMutation.mutateAsync,
    isCreating: createPlanMutation.isPending,
    updatePlan: updatePlanMutation.mutate,
    updatePlanAsync: updatePlanMutation.mutateAsync,
    isUpdating: updatePlanMutation.isPending,
    deletePlan: deletePlanMutation.mutate,
    deletePlanAsync: deletePlanMutation.mutateAsync,
    isDeleting: deletePlanMutation.isPending,
  };
}
