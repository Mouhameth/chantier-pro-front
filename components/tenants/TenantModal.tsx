'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CreditCardInput from '@/components/ui/CreditCardInput';
import type { CreateTenantData } from '@/types/tenant';
import type { Plan } from '@/types/plan';

// Detect card brand from card number
const detectCardBrand = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  return 'visa'; // default
};

// Combined schema for all form steps
const createTenantSchema = z.object({
  // Step 1 - Tenant info
  name: z
    .string()
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
    .max(100, 'Le nom doit contenir moins de 100 caractères'),
  slug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(50, 'Le slug doit contenir moins de 50 caractères')
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
    }),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),

  // Step 2 - Admin user info
  admin: z.object({
    firstName: z.string().min(1, 'Le prénom est requis').max(50),
    lastName: z.string().min(1, 'Le nom est requis').max(50),
    email: z.string().email('Adresse email invalide'),
    phone: z.string().optional(),
  }),

  // Step 3 - Subscription and payment
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  cardNumber: z
    .string()
    .min(13, 'Numéro de carte invalide')
    .regex(/^[\d\s]+$/, 'Numéro de carte invalide'),
  cardExpMonth: z
    .string()
    .length(2, 'Mois invalide')
    .regex(/^(0[1-9]|1[0-2])$/, 'Mois invalide (01-12)'),
  cardExpYear: z
    .string()
    .length(2, 'Année invalide')
    .regex(/^\d{2}$/, 'Année invalide'),
  cardCvv: z
    .string()
    .min(3, 'CVV invalide')
    .max(4, 'CVV invalide')
    .regex(/^\d+$/, 'CVV invalide'),
});

type TenantFormData = z.infer<typeof createTenantSchema>;

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTenantData) => void | Promise<void>;
  isLoading?: boolean;
  plans: Plan[];
}

export default function TenantModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  plans,
}: TenantModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    trigger,
  } = useForm<TenantFormData>({
    resolver: zodResolver(createTenantSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      phone: '',
      address: '',
      admin: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      },
      planId: plans.length > 0 ? plans[0].id.toString() : '1',
      billingCycle: 'monthly' as const,
      cardNumber: '',
      cardExpMonth: '',
      cardExpYear: '',
      cardCvv: '',
    },
  });

  const selectedPlanId = watch('planId');
  const billingCycle = watch('billingCycle');
  const cardNumberValue = watch('cardNumber') || '';
  const selectedPlan = plans.find(p => p.id === Number(selectedPlanId));

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      reset();
    }
  }, [isOpen, reset]);

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(['name', 'slug', 'email', 'phone', 'address']);
    } else if (currentStep === 2) {
      isValid = await trigger(['admin.firstName', 'admin.lastName', 'admin.email', 'admin.phone']);
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFormSubmit = async (data: TenantFormData) => {
    // Remove spaces from card number
    const cleanCardNumber = data.cardNumber.replace(/\s/g, '');

    // Extract last 4 digits and detect brand
    const cardLast4 = cleanCardNumber.slice(-4);
    const cardBrand = detectCardBrand(cleanCardNumber);

    // Convert 2-digit year to 4-digit year
    const fullYear = 2000 + parseInt(data.cardExpYear);

    const createData: CreateTenantData = {
      name: data.name,
      slug: data.slug.toLowerCase(), // Transform to lowercase
      email: data.email,
      phone: data.phone,
      address: data.address,
      admin: data.admin,
      planId: parseInt(data.planId, 10), // Convert string to number
      billingCycle: data.billingCycle,
      paymentMethod: {
        type: 'card',
        cardToken: `tok_${cardLast4}`, // Simulated token
        cardLast4,
        cardBrand,
        cardExpMonth: parseInt(data.cardExpMonth),
        cardExpYear: fullYear,
      },
    };

    await onSubmit(createData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Modal footer with buttons
  const modalFooter = (
    <div className="flex items-center justify-between gap-3">
      <div>
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
        >
          Annuler
        </Button>

        {currentStep < 3 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            disabled={isLoading}
          >
            Suivant
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            form="tenant-form"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Créer le client
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Créer un nouveau client"
      size="xl"
      footer={modalFooter}
    >
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all ${currentStep >= step
                    ? 'bg-primary border-primary text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-400'
                  }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div className="flex-1 mx-2 h-1 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${currentStep > step ? 'bg-primary w-full' : 'bg-gray-200 w-0'
                      }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex items-center justify-between mt-3">
          <span className={`text-sm font-medium transition-colors ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
            Informations client
          </span>
          <span className={`text-sm font-medium transition-colors ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
            Administrateur
          </span>
          <span className={`text-sm font-medium transition-colors ${currentStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
            Abonnement
          </span>
        </div>
      </div>

      <form id="tenant-form" onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Step 1: Tenant Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Input
              label="Nom de l'entreprise"
              placeholder="Mon Entreprise SARL"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Slug"
              placeholder="mon-entreprise"
              error={errors.slug?.message}
              {...register('slug')}
              helperText="Utilisé dans les URLs (ex: mon-entreprise.chantierpro.com)"
            />

            <Input
              type="email"
              label="Email de l'entreprise"
              placeholder="contact@monentreprise.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Téléphone (optionnel)"
              placeholder="+221 77 123 45 67"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse (optionnel)
              </label>
              <textarea
                {...register('address')}
                rows={3}
                placeholder="Adresse complète..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${errors.address
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                  }`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Admin Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Administrateur du compte
                  </p>
                  <p className="text-sm text-blue-700">
                    Cette personne recevra un email avec ses identifiants de connexion. Le mot de passe sera généré automatiquement.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Jean"
                error={errors.admin?.firstName?.message}
                {...register('admin.firstName')}
              />

              <Input
                label="Nom"
                placeholder="Dupont"
                error={errors.admin?.lastName?.message}
                {...register('admin.lastName')}
              />
            </div>

            <Input
              type="email"
              label="Email"
              placeholder="jean.dupont@monentreprise.com"
              error={errors.admin?.email?.message}
              {...register('admin.email')}
            />

            <Input
              label="Téléphone (optionnel)"
              placeholder="+221 77 123 45 67"
              error={errors.admin?.phone?.message}
              {...register('admin.phone')}
            />
          </div>
        )}

        {/* Step 3: Subscription & Payment */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Plan selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Sélectionner un plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`relative flex flex-col p-2.5 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${Number(selectedPlanId) === plan.id
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      value={plan.id}
                      {...register('planId', { valueAsNumber: true })}
                      className="sr-only"
                    />
                    {Number(selectedPlanId) === plan.id && (
                      <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-0.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="font-bold text-sm text-gray-900 mb-1">{plan.name}</div>
                    {plan.description && (
                      <p className="text-[10px] text-gray-600 mb-2 line-clamp-1">{plan.description}</p>
                    )}
                    <div className="space-y-0.5 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{plan.maxUsers} utilisateurs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{plan.maxProjects} projets</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{plan.maxSites} sites</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.planId && (
                <p className="mt-1 text-xs text-red-500">{errors.planId.message}</p>
              )}
            </div>

            {/* Billing cycle */}
            {selectedPlan && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Cycle de facturation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`relative flex flex-col p-2.5 border-2 rounded-lg cursor-pointer transition-all ${billingCycle === 'monthly'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      value="monthly"
                      {...register('billingCycle')}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900 text-xs mb-0.5">Mensuel</span>
                    <span className="text-lg font-bold text-gray-900">
                      {selectedPlan.priceMonthly.toLocaleString('fr-FR')} {selectedPlan.currency}
                    </span>
                    <span className="text-[10px] text-gray-500">par mois</span>
                  </label>

                  <label
                    className={`relative flex flex-col p-2.5 border-2 rounded-lg cursor-pointer transition-all ${billingCycle === 'yearly'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      value="yearly"
                      {...register('billingCycle')}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900 text-xs mb-0.5">Annuel</span>
                    <span className="text-lg font-bold text-gray-900">
                      {selectedPlan.priceYearly.toLocaleString('fr-FR')} {selectedPlan.currency}
                    </span>
                    <span className="text-[10px] text-gray-500">par an</span>
                  </label>
                </div>
              </div>
            )}

            {/* Credit card input */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Informations de paiement
              </h4>
              <CreditCardInput
                register={register}
                errors={errors}
                cardNumberValue={cardNumberValue}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
