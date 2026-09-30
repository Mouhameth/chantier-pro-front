'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { TenantWithDetails, UpdateTenantData } from '@/types/tenant';

// Schema de validation (correspond au backend)
const updateTenantSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom doit contenir moins de 100 caractères')
    .optional(),
  email: z.string().email('Adresse email invalide').optional(),
  phone: z.string().optional().nullable(),
  address: z.string().max(500, 'L\'adresse doit contenir moins de 500 caractères').optional().nullable(),
});

type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;

interface TenantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateTenantData) => void | Promise<void>;
  isLoading?: boolean;
  tenant: TenantWithDetails | null;
}

export default function TenantEditModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  tenant,
}: TenantEditModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateTenantSchema),
    mode: 'onChange',
  });

  // Reset form when tenant changes or modal opens
  useEffect(() => {
    if (tenant && isOpen) {
      reset({
        name: tenant.name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
      });
    }
  }, [tenant, isOpen, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: UpdateTenantFormData) => {
    // Only send fields that have values
    const updateData: UpdateTenantData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;

    await onSubmit(updateData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier le client"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Tenant Info */}
        <div className="space-y-4">
          <Input
            label="Nom de l'entreprise"
            placeholder="Mon Entreprise SARL"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            type="email"
            label="Email de l'entreprise"
            placeholder="contact@monentreprise.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Téléphone"
            placeholder="+221 77 123 45 67"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <textarea
              {...register('address')}
              rows={3}
              placeholder="Adresse complète..."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.address
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Informations modifiables
              </p>
              <p className="text-sm text-blue-700">
                Vous ne pouvez modifier que les informations de contact du client. Pour changer le plan ou l'abonnement, utilisez les actions correspondantes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
