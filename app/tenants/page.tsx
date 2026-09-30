'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import TenantModal from '@/components/tenants/TenantModal';
import TenantEditModal from '@/components/tenants/TenantEditModal';
import TenantCard from '@/components/tenants/TenantCard';
import TenantFilters from '@/components/tenants/TenantFilters';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTenants } from '@/hooks/useTenants';
import { usePlans } from '@/hooks/usePlans';
import { useSearch } from '@/lib/contexts/SearchContext';
import type { TenantWithDetails, CreateTenantData } from '@/types/tenant';
import { TenantStatus } from '@/types/tenant';

export default function TenantsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TenantStatus | null>(null);
  const itemsPerPage = 6;

  // Récupérer tous les tenants (limite haute pour avoir tous les résultats)
  const {
    tenants: allTenants,
    isLoading,
    createTenantAsync,
    isCreating,
    updateTenantAsync,
    isUpdating,
    cancelSubscriptionAsync,
    isCancellingSubscription,
    suspendTenantAsync,
    isSuspending,
    activateTenantAsync,
    isActivating,
  } = useTenants({
    page: 1,
    limit: 1000, // Limite haute pour récupérer tous les tenants
  });

  const { plans, isLoading: isLoadingPlans } = usePlans();
  const { searchQuery, setSearchQuery } = useSearch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<TenantWithDetails | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'suspend' | 'activate';
    tenant: TenantWithDetails | null;
  }>({ type: 'cancel', tenant: null });

  // Clear search when leaving the page
  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  const handleCreateTenant = async (data: CreateTenantData) => {
    try {
      await createTenantAsync(data);
      setIsModalOpen(false);
    } catch (error) {
      // Error is already handled by useTenants hook with toast
    }
  };

  const handleCancelSubscription = (tenant: TenantWithDetails) => {
    setConfirmAction({ type: 'cancel', tenant });
    setIsConfirmDialogOpen(true);
  };

  const handleSuspendTenant = (tenant: TenantWithDetails) => {
    setConfirmAction({ type: 'suspend', tenant });
    setIsConfirmDialogOpen(true);
  };

  const handleActivateTenant = (tenant: TenantWithDetails) => {
    setConfirmAction({ type: 'activate', tenant });
    setIsConfirmDialogOpen(true);
  };

  const handleEditTenant = (tenant: TenantWithDetails) => {
    setTenantToEdit(tenant);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!tenantToEdit) return;

    try {
      await updateTenantAsync({ id: tenantToEdit.id, data });
      setIsEditModalOpen(false);
      setTenantToEdit(null);
    } catch (error) {
      // Error is already handled by useTenants hook with toast
    }
  };

  const handlePlanFilterChange = (planId: number | null) => {
    setSelectedPlanId(planId);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleStatusFilterChange = (status: TenantStatus | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction.tenant) return;

    try {
      if (confirmAction.type === 'cancel') {
        await cancelSubscriptionAsync(confirmAction.tenant.id);
      } else if (confirmAction.type === 'suspend') {
        await suspendTenantAsync(confirmAction.tenant.id);
      } else if (confirmAction.type === 'activate') {
        await activateTenantAsync(confirmAction.tenant.id);
      }
      setIsConfirmDialogOpen(false);
      setConfirmAction({ type: 'cancel', tenant: null });
    } catch (error) {
      // Error is already handled by hook with toast
    }
  };

  // Filtrage côté frontend
  const filteredTenants = (allTenants || []).filter((tenant) => {
    // Filtre par recherche
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      tenant.name.toLowerCase().includes(query) ||
      tenant.slug.toLowerCase().includes(query) ||
      tenant.email.toLowerCase().includes(query);

    // Filtre par plan
    const matchesPlan = !selectedPlanId ||
      (tenant.subscription?.planId === selectedPlanId);

    // Filtre par status
    const matchesStatus = !selectedStatus ||
      tenant.status === selectedStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Pagination côté frontend
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex);

  // Créer un objet pagination pour le composant
  const pagination = {
    total: filteredTenants.length,
    page: currentPage,
    limit: itemsPerPage,
    pages: totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };

  const getConfirmMessage = () => {
    if (!confirmAction.tenant) return '';

    switch (confirmAction.type) {
      case 'cancel':
        return `Êtes-vous sûr de vouloir annuler l'abonnement de "${confirmAction.tenant.name}" ? Le client ne pourra plus accéder à la plateforme.`;
      case 'suspend':
        return `Êtes-vous sûr de vouloir suspendre "${confirmAction.tenant.name}" ? Le client ne pourra plus accéder à la plateforme temporairement.`;
      case 'activate':
        return `Êtes-vous sûr de vouloir activer "${confirmAction.tenant.name}" ? Le client retrouvera l'accès à la plateforme.`;
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Clients</h1>
              <p className="text-gray-600">
                Gérez vos clients et leurs abonnements
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              disabled={isCreating || isLoadingPlans}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouveau client
            </Button>
          </div>

          {/* Filters */}
          {!isLoadingPlans && plans.length > 0 && (
            <TenantFilters
              plans={plans}
              selectedPlanId={selectedPlanId}
              onPlanChange={handlePlanFilterChange}
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusFilterChange}
            />
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-56">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && allTenants && allTenants.length > 0 && filteredTenants.length === 0 && (
          <Card padding="lg">
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? `Aucun client ne correspond à votre recherche "${searchQuery}"`
                  : 'Aucun client ne correspond aux filtres sélectionnés'
                }
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Effacer la recherche
                  </Button>
                )}
                {selectedPlanId && (
                  <Button variant="outline" onClick={() => setSelectedPlanId(null)}>
                    Effacer le filtre plan
                  </Button>
                )}
                {selectedStatus && (
                  <Button variant="outline" onClick={() => setSelectedStatus(null)}>
                    Effacer le filtre statut
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!allTenants || allTenants.length === 0) && (
          <Card padding="lg">
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun client
              </h3>
              <p className="text-gray-500 mb-6">
                Commencez par créer votre premier client
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Nouveau client
              </Button>
            </div>
          </Card>
        )}

        {/* Tenants Grid */}
        {!isLoading && filteredTenants.length > 0 && (
          <>
            {/* Pagination Top */}
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <TenantCard
                    tenant={tenant}
                    index={index}
                    onEdit={() => handleEditTenant(tenant)}
                    onSuspend={() => handleSuspendTenant(tenant)}
                    onActivate={() => handleActivateTenant(tenant)}
                    onCancelSubscription={() => handleCancelSubscription(tenant)}
                    isSuspending={isSuspending}
                    isActivating={isActivating}
                    isCancellingSubscription={isCancellingSubscription}
                  />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
              />
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <TenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTenant}
        isLoading={isCreating}
        plans={plans}
      />

      {/* Edit Modal */}
      <TenantEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTenantToEdit(null);
        }}
        onSubmit={handleEditSubmit}
        isLoading={isUpdating}
        tenant={tenantToEdit}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setConfirmAction({ type: 'cancel', tenant: null });
        }}
        onConfirm={handleConfirmAction}
        title={
          confirmAction.type === 'cancel'
            ? "Annuler l'abonnement"
            : confirmAction.type === 'suspend'
            ? 'Suspendre le client'
            : 'Activer le client'
        }
        message={getConfirmMessage()}
        confirmText={
          confirmAction.type === 'cancel'
            ? 'Annuler'
            : confirmAction.type === 'suspend'
            ? 'Suspendre'
            : 'Activer'
        }
        cancelText="Retour"
        type={confirmAction.type === 'activate' ? 'info' : 'danger'}
        isLoading={isCancellingSubscription || isSuspending || isActivating}
      />
    </DashboardLayout>
  );
}
