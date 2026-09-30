'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserCard from '@/components/users/UserCard';
import UserFilters from '@/components/users/UserFilters';
import UserModal from '@/components/users/UserModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { usersApi } from '@/lib/api/users';
import { User, UserFilters as IUserFilters, CreateUserData } from '@/types/auth';
import { showToast } from '@/lib/utils/toast';
import { UserPlus, Users as UsersIcon, Loader2, AlertCircle, Search, X } from 'lucide-react';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<IUserFilters>({ page: 1, pageSize: 12 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState('');

  // Fetch users (only pagination, all filtering is client-side)
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', { page: filters.page, pageSize: filters.pageSize }],
    queryFn: () => usersApi.list({ page: filters.page, pageSize: filters.pageSize }),
  });

  // Client-side filtering (search + role + status)
  const filteredUsers = data?.data.filter((user) => {
    // Filter by search
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const phone = user.phone?.toLowerCase() || '';

      const matchesSearch = fullName.includes(searchLower) ||
                           email.includes(searchLower) ||
                           phone.includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Filter by role
    if (filters.role && user.role !== filters.role) {
      return false;
    }

    // Filter by status
    if (filters.isActive !== undefined && user.isActive !== filters.isActive) {
      return false;
    }

    return true;
  }) || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      showToast.success('Utilisateur créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de la création');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserData> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      showToast.success('Utilisateur modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      console.log(error);
      
      showToast.error(error.message || 'Erreur lors de la modification');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      showToast.success('Utilisateur supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (id: number) => usersApi.activate(id),
    onSuccess: () => {
      showToast.success('Utilisateur activé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToToggleStatus(null);
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de l\'activation');
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => {
      showToast.success('Utilisateur désactivé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToToggleStatus(null);
    },
    onError: (error: Error) => {
      showToast.error(error.message || 'Erreur lors de la désactivation');
    },
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: CreateUserData) => {
    if (selectedUser) {
      console.log('Selected user tenantId:', selectedUser.tenantId);
      const updateData = { ...data, tenantId: selectedUser.tenantId };
      console.log('Data being sent to mutation:', updateData);

      await updateMutation.mutateAsync({
        id: selectedUser.id,
        data: updateData as any
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const handleToggleStatus = (user: User) => {
    setUserToToggleStatus(user);
  };

  const confirmToggleStatus = () => {
    if (userToToggleStatus) {
      if (userToToggleStatus.isActive) {
        deactivateMutation.mutate(userToToggleStatus.id);
      } else {
        activateMutation.mutate(userToToggleStatus.id);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion des utilisateurs
                </h1>
                <p className="text-gray-600 mt-1">
                  {data?.pagination.total || 0} utilisateur(s) au total
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleCreateUser}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par nom, email, téléphone..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filters */}
            <UserFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Pagination Controls */}
          {data && data.pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">
                  Affichage {((filters.page || 1) - 1) * (filters.pageSize || 12) + 1} - {Math.min((filters.page || 1) * (filters.pageSize || 12), data.pagination.total)} sur {data.pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Éléments par page:</label>
                  <select
                    value={filters.pageSize || 12}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>

              {data.pagination.pages > 1 && (
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.pages}
                  hasNext={data.pagination.hasNext}
                  hasPrev={data.pagination.hasPrev}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Chargement des utilisateurs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-600 mb-4">
                {(error as Error).message || 'Une erreur est survenue'}
              </p>
              <Button variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
                Réessayer
              </Button>
            </div>
          </div>
        ) : !data?.data.length ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre premier utilisateur
              </p>
              <Button variant="primary" onClick={handleCreateUser}>
                <UserPlus className="w-4 h-4 mr-2" />
                Créer un utilisateur
              </Button>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Aucun utilisateur ne correspond à votre recherche "{searchInput}"
              </p>
              <Button variant="ghost" onClick={() => setSearchInput('')}>
                <X className="w-4 h-4 mr-2" />
                Effacer la recherche
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Users Grid */}
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSubmit}
        user={selectedUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.firstName} ${userToDelete?.lastName} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteMutation.isPending}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={confirmToggleStatus}
        title={userToToggleStatus?.isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
        message={
          userToToggleStatus?.isActive
            ? `Êtes-vous sûr de vouloir désactiver ${userToToggleStatus?.firstName} ${userToToggleStatus?.lastName} ? Cet utilisateur ne pourra plus se connecter.`
            : `Êtes-vous sûr de vouloir activer ${userToToggleStatus?.firstName} ${userToToggleStatus?.lastName} ? Cet utilisateur pourra à nouveau se connecter.`
        }
        confirmText={userToToggleStatus?.isActive ? "Désactiver" : "Activer"}
        cancelText="Annuler"
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      />
    </DashboardLayout>
  );
}
