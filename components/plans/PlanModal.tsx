'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { PlanWithStats } from '@/types/plan';

const createPlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom doit contenir moins de 50 caractères')
    .regex(/^[A-Z_]+$/, 'Le nom doit contenir uniquement des majuscules et des underscores')
    .transform((val) => val.toUpperCase()),
  description: z.string().max(500, 'La description doit contenir moins de 500 caractères').optional(),
  priceMonthly: z.coerce
    .number()
    .nonnegative('Le prix mensuel doit être 0 ou positif')
    .default(0),
  priceYearly: z.coerce
    .number()
    .nonnegative('Le prix annuel doit être 0 ou positif')
    .default(0),
  currency: z
    .string()
    .length(3, 'La devise doit être un code à 3 lettres (ex: XOF, EUR, USD)')
    .toUpperCase()
    .default('XOF'),
  maxUsers: z.coerce
    .number()
    .int('Doit être un nombre entier')
    .min(1, 'Doit être au moins 1'),
  maxProjects: z.coerce
    .number()
    .int('Doit être un nombre entier')
    .min(1, 'Doit être au moins 1'),
  maxSites: z.coerce
    .number()
    .int('Doit être un nombre entier')
    .min(1, 'Doit être au moins 1'),
  stripeProductId: z.string().optional(),
  stripePriceMonthlyId: z.string().optional(),
  stripePriceYearlyId: z.string().optional(),
});

type PlanFormData = z.infer<typeof createPlanSchema>;

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlanFormData) => void | Promise<void>;
  isLoading?: boolean;
  plan?: PlanWithStats | null;
}

export default function PlanModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  plan,
}: PlanModalProps) {
  const isEditMode = !!plan;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PlanFormData>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'XOF',
      maxUsers: 1,
      maxProjects: 1,
      maxSites: 1,
      stripeProductId: '',
      stripePriceMonthlyId: '',
      stripePriceYearlyId: '',
    },
  });

  // Reset form when plan changes (for edit mode)
  useEffect(() => {
    if (isOpen) {
      if (plan) {
        reset({
          name: plan.name,
          description: plan.description || '',
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          currency: plan.currency,
          maxUsers: plan.maxUsers,
          maxProjects: plan.maxProjects,
          maxSites: plan.maxSites,
          stripeProductId: plan.stripeProductId || '',
          stripePriceMonthlyId: plan.stripePriceMonthlyId || '',
          stripePriceYearlyId: plan.stripePriceYearlyId || '',
        });
      } else {
        reset({
          name: '',
          description: '',
          priceMonthly: 0,
          priceYearly: 0,
          currency: 'XOF',
          maxUsers: 1,
          maxProjects: 1,
          maxSites: 1,
          stripeProductId: '',
          stripePriceMonthlyId: '',
          stripePriceYearlyId: '',
        });
      }
    }
  }, [plan, isOpen, reset]);

  const handleFormSubmit = async (data: PlanFormData) => {
    await onSubmit(data);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Modifier le plan' : 'Créer un nouveau plan'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <Input
            label="Nom du plan"
            placeholder="FREE, PREMIUM, ENTERPRISE"
            error={errors.name?.message}
            {...register('name')}
          />
          <p className="mt-1 text-xs text-gray-500">
            Majuscules et underscores uniquement (ex: FREE, PREMIUM_PLUS)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Description du plan..."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.description
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Price Monthly, Yearly and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="number"
              label="Prix mensuel"
              placeholder="0"
              step="0.01"
              error={errors.priceMonthly?.message}
              {...register('priceMonthly')}
            />
          </div>
          <div>
            <Input
              type="number"
              label="Prix annuel"
              placeholder="0"
              step="0.01"
              error={errors.priceYearly?.message}
              {...register('priceYearly')}
            />
          </div>
          <div>
            <Input
              label="Devise"
              placeholder="XOF"
              maxLength={3}
              error={errors.currency?.message}
              {...register('currency')}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ex: XOF, EUR, USD
            </p>
          </div>
        </div>

        {/* Limits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="number"
            label="Max Utilisateurs"
            placeholder="1"
            error={errors.maxUsers?.message}
            {...register('maxUsers')}
          />
          <Input
            type="number"
            label="Max Projets"
            placeholder="1"
            error={errors.maxProjects?.message}
            {...register('maxProjects')}
          />
          <Input
            type="number"
            label="Max Sites"
            placeholder="1"
            error={errors.maxSites?.message}
            {...register('maxSites')}
          />
        </div>

        {/* Stripe Integration (Optional) */}
        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Intégration Stripe (optionnel)
            </h4>
          </div>

          <Input
            label="Stripe Product ID"
            placeholder="prod_xxxxxxxxxxxxx"
            error={errors.stripeProductId?.message}
            {...register('stripeProductId')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Stripe Price ID (Mensuel)"
              placeholder="price_xxxxxxxxxxxxx"
              error={errors.stripePriceMonthlyId?.message}
              {...register('stripePriceMonthlyId')}
            />
            <Input
              label="Stripe Price ID (Annuel)"
              placeholder="price_xxxxxxxxxxxxx"
              error={errors.stripePriceYearlyId?.message}
              {...register('stripePriceYearlyId')}
            />
          </div>

          <p className="text-xs text-gray-500">
            IDs Stripe pour l&apos;intégration de paiement (laissez vide si non utilisé)
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
