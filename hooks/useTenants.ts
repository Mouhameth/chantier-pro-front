'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsApi, type GetTenantsParams } from '@/lib/api/tenants';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreateTenantData, UpdateTenantData } from '@/types/tenant';
import { showToast } from '@/lib/utils/toast';

export function useTenants(params?: GetTenantsParams) {
  const queryClient = useQueryClient();

  // Fetch all tenants with pagination
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.TENANTS, params],
    queryFn: () => tenantsApi.getTenants(params),
  });

  const tenants = data?.data || [];
  const pagination = data?.pagination;

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: (data: CreateTenantData) => tenantsApi.createTenant(data),
    onSuccess: () => {
      showToast.success('Client créé avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erreur lors de la création du client';
      showToast.error(errorMessage);
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantData }) =>
      tenantsApi.updateTenant(id, data),
    onSuccess: () => {
      showToast.success('Client mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erreur lors de la mise à jour du client';
      showToast.error(errorMessage);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.cancelSubscription(id),
    onSuccess: () => {
      showToast.success('Abonnement annulé avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Erreur lors de l'annulation de l'abonnement";
      showToast.error(errorMessage);
    },
  });

  // Renew subscription mutation
  const renewSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { planId: number; billingCycle: 'monthly' | 'yearly' } }) =>
      tenantsApi.renewSubscription(id, data),
    onSuccess: () => {
      showToast.success('Abonnement renouvelé avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Erreur lors du renouvellement de l'abonnement";
      showToast.error(errorMessage);
    },
  });

  // Suspend tenant mutation
  const suspendTenantMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.suspendTenant(id),
    onSuccess: () => {
      showToast.success('Client suspendu avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Erreur lors de la suspension du client';
      showToast.error(errorMessage);
    },
  });

  // Activate tenant mutation
  const activateTenantMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.activateTenant(id),
    onSuccess: () => {
      showToast.success('Client activé avec succès');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Erreur lors de l'activation du client";
      showToast.error(errorMessage);
    },
  });

  return {
    tenants,
    pagination,
    isLoading,
    error,
    refetch,
    createTenant: createTenantMutation.mutate,
    createTenantAsync: createTenantMutation.mutateAsync,
    isCreating: createTenantMutation.isPending,
    updateTenant: updateTenantMutation.mutate,
    updateTenantAsync: updateTenantMutation.mutateAsync,
    isUpdating: updateTenantMutation.isPending,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    cancelSubscriptionAsync: cancelSubscriptionMutation.mutateAsync,
    isCancellingSubscription: cancelSubscriptionMutation.isPending,
    renewSubscription: renewSubscriptionMutation.mutate,
    renewSubscriptionAsync: renewSubscriptionMutation.mutateAsync,
    isRenewingSubscription: renewSubscriptionMutation.isPending,
    suspendTenant: suspendTenantMutation.mutate,
    suspendTenantAsync: suspendTenantMutation.mutateAsync,
    isSuspending: suspendTenantMutation.isPending,
    activateTenant: activateTenantMutation.mutate,
    activateTenantAsync: activateTenantMutation.mutateAsync,
    isActivating: activateTenantMutation.isPending,
  };
}
