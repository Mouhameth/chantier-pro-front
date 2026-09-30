'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Stepper, { Step } from '@/components/ui/Stepper';
import CountrySelect from '@/components/ui/CountrySelect';
import { Project, CreateProjectData, ProjectType, ProjectStatus } from '@/types/project';
import { projectsApi } from '@/lib/api/projects';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectData) => Promise<void>;
  project?: Project | null;
  isLoading?: boolean;
}

const STEPS: Step[] = [
  { id: 1, title: 'Informations', description: 'Générales' },
  { id: 2, title: 'Planification', description: 'Dates' },
  { id: 3, title: 'Financier', description: 'Budget' },
  { id: 4, title: 'Organisation', description: 'Équipe' },
];

const PROJECT_TYPES = [
  // 🏠 Bâtiment
  { value: ProjectType.RESIDENTIAL_CONSTRUCTION, label: 'Construction Résidentielle', category: 'Bâtiment' },
  { value: ProjectType.COMMERCIAL_CONSTRUCTION, label: 'Construction Commerciale', category: 'Bâtiment' },
  { value: ProjectType.INDUSTRIAL_CONSTRUCTION, label: 'Construction Industrielle', category: 'Bâtiment' },
  { value: ProjectType.INSTITUTIONAL_CONSTRUCTION, label: 'Construction Institutionnelle', category: 'Bâtiment' },
  { value: ProjectType.MIXED_USE_CONSTRUCTION, label: 'Construction à Usage Mixte', category: 'Bâtiment' },

  // 🔨 Rénovation & réhabilitation
  { value: ProjectType.RENOVATION, label: 'Rénovation', category: 'Rénovation & Réhabilitation' },
  { value: ProjectType.REHABILITATION, label: 'Réhabilitation', category: 'Rénovation & Réhabilitation' },
  { value: ProjectType.RESTORATION, label: 'Restauration', category: 'Rénovation & Réhabilitation' },
  { value: ProjectType.REFURBISHMENT, label: 'Remise à Niveau', category: 'Rénovation & Réhabilitation' },

  // 🛣️ Infrastructures & génie civil
  { value: ProjectType.ROAD_CONSTRUCTION, label: 'Construction Routière', category: 'Infrastructures & Génie Civil' },
  { value: ProjectType.BRIDGE_CONSTRUCTION, label: 'Construction de Pont', category: 'Infrastructures & Génie Civil' },
  { value: ProjectType.TUNNEL_CONSTRUCTION, label: 'Construction de Tunnel', category: 'Infrastructures & Génie Civil' },
  { value: ProjectType.RAILWAY_CONSTRUCTION, label: 'Construction Ferroviaire', category: 'Infrastructures & Génie Civil' },
  { value: ProjectType.AIRPORT_INFRASTRUCTURE, label: 'Infrastructure Aéroportuaire', category: 'Infrastructures & Génie Civil' },
  { value: ProjectType.PORT_INFRASTRUCTURE, label: 'Infrastructure Portuaire', category: 'Infrastructures & Génie Civil' },
  { value: ProjectType.DAM_CONSTRUCTION, label: 'Construction de Barrage', category: 'Infrastructures & Génie Civil' },

  // 🌍 VRD & réseaux
  { value: ProjectType.URBAN_DEVELOPMENT, label: 'Développement Urbain (VRD)', category: 'VRD & Réseaux' },
  { value: ProjectType.WATER_SUPPLY, label: 'Adduction d\'Eau', category: 'VRD & Réseaux' },
  { value: ProjectType.SEWERAGE, label: 'Assainissement', category: 'VRD & Réseaux' },
  { value: ProjectType.DRAINAGE, label: 'Drainage', category: 'VRD & Réseaux' },
  { value: ProjectType.POWER_DISTRIBUTION, label: 'Distribution Électrique', category: 'VRD & Réseaux' },
  { value: ProjectType.TELECOM_INFRASTRUCTURE, label: 'Infrastructure Télécom', category: 'VRD & Réseaux' },

  // ⚡ Énergie & environnement
  { value: ProjectType.POWER_PLANT, label: 'Centrale Électrique', category: 'Énergie & Environnement' },
  { value: ProjectType.RENEWABLE_ENERGY, label: 'Énergie Renouvelable', category: 'Énergie & Environnement' },
  { value: ProjectType.OIL_AND_GAS, label: 'Pétrole & Gaz', category: 'Énergie & Environnement' },
  { value: ProjectType.MINING_INFRASTRUCTURE, label: 'Infrastructure Minière', category: 'Énergie & Environnement' },

  // 🧱 Travaux spécialisés
  { value: ProjectType.EARTHWORKS, label: 'Terrassement', category: 'Travaux Spécialisés' },
  { value: ProjectType.DEMOLITION, label: 'Démolition', category: 'Travaux Spécialisés' },
  { value: ProjectType.STEEL_STRUCTURE, label: 'Charpente Métallique', category: 'Travaux Spécialisés' },
  { value: ProjectType.CONCRETE_WORKS, label: 'Béton Armé', category: 'Travaux Spécialisés' },
  { value: ProjectType.FINISHING_WORKS, label: 'Second Œuvre', category: 'Travaux Spécialisés' },

  // 🏗️ Maintenance & exploitation
  { value: ProjectType.MAINTENANCE, label: 'Maintenance', category: 'Maintenance & Exploitation' },
  { value: ProjectType.FACILITY_MANAGEMENT, label: 'Gestion de Patrimoine', category: 'Maintenance & Exploitation' },

  // 📐 Études & conception
  { value: ProjectType.DESIGN, label: 'Conception Architecturale', category: 'Études & Conception' },
  { value: ProjectType.ENGINEERING, label: 'Études Techniques', category: 'Études & Conception' },
  { value: ProjectType.SURVEYING, label: 'Levés Topographiques', category: 'Études & Conception' },

  // 🧪 Autres
  { value: ProjectType.TURNKEY_PROJECT, label: 'Projet Clé en Main', category: 'Autres' },
  { value: ProjectType.PPP_PROJECT, label: 'Partenariat Public-Privé', category: 'Autres' },
  { value: ProjectType.OTHER, label: 'Autre', category: 'Autres' },
];

const PROJECT_STATUSES = [
  { value: ProjectStatus.PLANNING, label: 'Planification', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { value: ProjectStatus.IN_PROGRESS, label: 'En cours', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  { value: ProjectStatus.ON_HOLD, label: 'En pause', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  { value: ProjectStatus.DELAYED, label: 'Retardé', color: 'text-red-700', bgColor: 'bg-red-50' },
  { value: ProjectStatus.COMPLETED, label: 'Terminé', color: 'text-green-700', bgColor: 'bg-green-50' },
  { value: ProjectStatus.CANCELLED, label: 'Annulé', color: 'text-gray-700', bgColor: 'bg-gray-200' },
];

export default function ProjectModal({ isOpen, onClose, onSubmit, project, isLoading }: ProjectModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateProjectData>>({
    title: '',
    description: '',
    projectType: ProjectType.RESIDENTIAL_CONSTRUCTION,
    clientReference: '',
    country: 'SN',
    startDate: '',
    endDate: '',
    budget: 0,
    currency: 'XOF',
    projectManagerId: 0,
    status: ProjectStatus.PLANNING,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectData, string>>>({});

  // Fetch project managers
  const { data: projectManagers = [] } = useQuery({
    queryKey: ['project-managers'],
    queryFn: () => projectsApi.getProjectManagers(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (project) {
      setFormData({
        id: project.id,
        title: project.title,
        description: project.description || '',
        projectType: project.projectType,
        clientReference: project.clientReference || '',
        country: project.country || 'SN',
        startDate: project.startDate?.split('T')[0] || '',
        endDate: project.endDate?.split('T')[0] || '',
        budget: parseFloat(project.budget) || 0,
        currency: project.currency,
        projectManagerId: project.projectManagerId || 0,
        status: project.status,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        projectType: ProjectType.RESIDENTIAL_CONSTRUCTION,
        clientReference: '',
        country: 'SN',
        startDate: '',
        endDate: '',
        budget: 0,
        currency: 'XOF',
        projectManagerId: 0,
        status: ProjectStatus.PLANNING,
      });
    }
    setCurrentStep(1);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, isOpen]);

  // Set default project manager when data loads
  useEffect(() => {
    if (!project && projectManagers.length > 0 && formData.projectManagerId === 0) {
      setFormData((prev) => ({
        ...prev,
        projectManagerId: projectManagers[0].id,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectManagers]);

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof CreateProjectData, string>> = {};

    if (step === 1) {
      if (!formData.title || formData.title.trim().length < 3) {
        newErrors.title = 'Titre requis (min 3 caractères)';
      }
      if (!formData.projectType) {
        newErrors.projectType = 'Type de projet requis';
      }
    }

    if (step === 2) {
      if (!formData.startDate) {
        newErrors.startDate = 'Date de début requise';
      }
      if (!formData.endDate) {
        newErrors.endDate = 'Date de fin requise';
      }
      if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    if (step === 3) {
      if (!formData.budget || formData.budget <= 0) {
        newErrors.budget = 'Budget requis (> 0)';
      }
      if (!formData.currency) {
        newErrors.currency = 'Devise requise';
      }
    }

    if (step === 4) {
      if (!formData.projectManagerId || formData.projectManagerId === 0) {
        newErrors.projectManagerId = 'Chef de projet requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    if (currentStep < STEPS.length) {
      handleNext();
      return;
    }

    try {
      // Convert dates to ISO format with timezone
      const submitData = {
        ...formData,
        startDate: formData.startDate ? `${formData.startDate}T00:00:00Z` : '',
        endDate: formData.endDate ? `${formData.endDate}T00:00:00Z` : '',
      } as CreateProjectData;

      console.log(submitData);

      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleChange = (field: keyof CreateProjectData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return 'N/A';
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return months > 0 ? `${months} mois ${remainingDays} jours` : `${days} jours`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={project ? 'Modifier le projet' : 'Nouveau projet'}>
      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Informations générales */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Construction Résidence Les Almadies"
                error={errors.title}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de projet <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => handleChange('projectType', e.target.value as ProjectType)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:border-primary transition-colors"
                disabled={isLoading}
              >
                {Object.entries(
                  PROJECT_TYPES.reduce((acc, type) => {
                    if (!acc[type.category]) acc[type.category] = [];
                    acc[type.category].push(type);
                    return acc;
                  }, {} as Record<string, typeof PROJECT_TYPES>)
                ).map(([category, types]) => (
                  <optgroup key={category} label={category}>
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.projectType && <p className="text-red-500 text-xs mt-1">{errors.projectType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description du projet..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:border-primary transition-colors resize-none"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Référence client</label>
              <Input
                type="text"
                value={formData.clientReference || ''}
                onChange={(e) => handleChange('clientReference', e.target.value)}
                placeholder="Ex: AO-2025-INFRA-042"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Step 2: Planification */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  error={errors.startDate}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  error={errors.endDate}
                  disabled={isLoading}
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Durée estimée:</span> {calculateDuration()}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
              <CountrySelect
                value={formData.country || 'SN'}
                onChange={(code) => handleChange('country', code)}
                disabled={isLoading}
                placeholder="Sélectionner un pays"
              />
            </div>
          </div>
        )}

        {/* Step 3: Financier */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
                placeholder="5000000000"
                error={errors.budget}
                disabled={isLoading}
                min="0"
                step="1000"
              />
              {formData.budget && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Intl.NumberFormat('fr-FR').format(formData.budget)} {formData.currency}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:border-primary transition-colors"
                disabled={isLoading}
              >
                <option value="XOF">XOF (Franc CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
              {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency}</p>}
            </div>
          </div>
        )}

        {/* Step 4: Organisation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chef de projet <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.projectManagerId || ''}
                onChange={(e) => handleChange('projectManagerId', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:border-primary transition-colors"
                disabled={isLoading}
              >
                <option value="">Sélectionner un chef de projet</option>
                {projectManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                  </option>
                ))}
              </select>
              {errors.projectManagerId && <p className="text-red-500 text-xs mt-1">{errors.projectManagerId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut du projet</label>
              <div className="grid grid-cols-2 gap-2">
                {PROJECT_STATUSES.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleChange('status', status.value)}
                    disabled={isLoading}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                      formData.status === status.value
                        ? `border-primary ${status.bgColor} ${status.color}`
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary hover:bg-gray-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="ghost" onClick={handlePrevious} disabled={isLoading}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="submit" variant="primary" disabled={isLoading}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {project ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {project ? 'Modifier' : 'Créer le projet'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
