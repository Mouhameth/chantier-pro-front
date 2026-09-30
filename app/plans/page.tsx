'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlanModal from '@/components/plans/PlanModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { usePlans } from '@/hooks/usePlans';
import { useSearch } from '@/lib/contexts/SearchContext';
import type { PlanWithStats, CreatePlanData } from '@/types/plan';

export default function PlansPage() {
  const {
    plans,
    isLoading,
    createPlanAsync,
    isCreating,
    updatePlanAsync,
    isUpdating,
    deletePlanAsync,
    isDeleting,
  } = usePlans();

  const { searchQuery, setSearchQuery } = useSearch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanWithStats | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanWithStats | null>(null);

  // Clear search when leaving the page
  useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, [setSearchQuery]);

  const handleCreatePlan = async (data: CreatePlanData) => {
    try {
      await createPlanAsync(data);
      setIsModalOpen(false);
    } catch (error) {
      // Error is already handled by usePlans hook with toast
    }
  };

  const handleUpdatePlan = async (data: CreatePlanData) => {
    if (selectedPlan) {
      try {
        await updatePlanAsync({ id: selectedPlan.id, data });
        setIsModalOpen(false);
        setSelectedPlan(null);
      } catch (error) {
        // Error is already handled by usePlans hook with toast
      }
    }
  };

  const handleEditClick = (plan: PlanWithStats) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (plan: PlanWithStats) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (planToDelete) {
      try {
        await deletePlanAsync(planToDelete.id);
        setIsDeleteDialogOpen(false);
        setPlanToDelete(null);
      } catch (error) {
        // Error is already handled by usePlans hook with toast
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  // Filter plans based on search query
  const filteredPlans = plans.filter((plan) => {
    const query = searchQuery.toLowerCase();
    return (
      plan.name.toLowerCase().includes(query) ||
      plan.description?.toLowerCase().includes(query) ||
      plan.stripeProductId?.toLowerCase().includes(query) ||
      plan.stripePriceMonthlyId?.toLowerCase().includes(query) ||
      plan.stripePriceYearlyId?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Plans</h1>
            <p className="text-gray-600">
              Gérez les plans d&apos;abonnement de votre application
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            disabled={isCreating}
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
            Créer un plan
          </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-56">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && plans.length > 0 && filteredPlans.length === 0 && (
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
                Aucun plan ne correspond à votre recherche &quot;{searchQuery}&quot;
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Effacer la recherche
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && plans.length === 0 && (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun plan disponible
              </h3>
              <p className="text-gray-500 mb-6">
                Commencez par créer votre premier plan d&apos;abonnement
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Créer un plan
              </Button>
            </div>
          </Card>
        )}

        {/* Plans Grid */}
        {!isLoading && filteredPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card padding="lg" hover>
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {plan._count.subscriptions} abonnés
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {plan.priceMonthly.toLocaleString('fr-FR')} {plan.currency}
                      </div>
                      <span className="text-sm font-normal text-gray-500">/mois</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-xl font-semibold text-gray-700">
                        {plan.priceYearly.toLocaleString('fr-FR')} {plan.currency}
                      </div>
                      <span className="text-xs font-normal text-gray-500">/an</span>
                    </div>
                  </div>

                  {/* Plan Limits */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        Utilisateurs
                      </span>
                      <span className="font-semibold text-gray-900">
                        {plan.maxUsers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Projets
                      </span>
                      <span className="font-semibold text-gray-900">
                        {plan.maxProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Sites
                      </span>
                      <span className="font-semibold text-gray-900">
                        {plan.maxSites}
                      </span>
                    </div>
                  </div>

                  {/* Stripe IDs */}
                  {(plan.stripeProductId || plan.stripePriceMonthlyId || plan.stripePriceYearlyId) && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-gray-600 mb-2">Intégration Stripe</p>
                      {plan.stripeProductId && (
                        <div>
                          <p className="text-xs text-gray-500">Product ID</p>
                          <p className="text-xs font-mono text-gray-700 truncate">
                            {plan.stripeProductId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => handleEditClick(plan)}
                      disabled={isUpdating || isDeleting}
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(plan)}
                      disabled={isDeleting}
                      className=" hover:border-red-600 hover:bg-red-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Créé le</span>
                      <span className="text-gray-700">
                        {new Date(plan.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {plan.createdByUser && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Par</span>
                        <span className="text-gray-700 font-medium">
                          {plan.createdByUser.firstName} {plan.createdByUser.lastName}
                        </span>
                      </div>
                    )}
                    {plan.updatedByUser && (
                      <>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                          <span className="text-gray-500">Modifié le</span>
                          <span className="text-gray-700">
                            {new Date(plan.updatedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Par</span>
                          <span className="text-gray-700 font-medium">
                            {plan.updatedByUser.firstName} {plan.updatedByUser.lastName}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={selectedPlan ? handleUpdatePlan : handleCreatePlan}
        isLoading={isCreating || isUpdating}
        plan={selectedPlan}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce plan"
        message={`Êtes-vous sûr de vouloir supprimer le plan "${planToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
