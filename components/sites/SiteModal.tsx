'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Site, CreateSiteData, SiteStatus } from '@/types/site';
import { projectsApi } from '@/lib/api/projects';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSiteData) => Promise<void>;
  site?: Site | null;
  isLoading?: boolean;
  defaultProjectId?: number;
}

const SITE_STATUSES = [
  { value: SiteStatus.NOT_STARTED, label: 'Pas encore démarré', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  { value: SiteStatus.IN_PROGRESS, label: 'En cours', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  { value: SiteStatus.ON_HOLD, label: 'En pause', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  { value: SiteStatus.DELAYED, label: 'Retardé', color: 'text-red-700', bgColor: 'bg-red-50' },
  { value: SiteStatus.COMPLETED, label: 'Terminé', color: 'text-green-700', bgColor: 'bg-green-50' },
  { value: SiteStatus.CANCELLED, label: 'Annulé', color: 'text-gray-700', bgColor: 'bg-gray-200' },
];

export default function SiteModal({ isOpen, onClose, onSubmit, site, isLoading, defaultProjectId }: SiteModalProps) {
  const [formData, setFormData] = useState<Partial<CreateSiteData>>({
    name: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    progress: 0,
    status: SiteStatus.NOT_STARTED,
    projectId: defaultProjectId || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch projects for the select dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects', { pageSize: 100 }],
    queryFn: () => projectsApi.list({ pageSize: 100 }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        description: site.description || '',
        address: site.address,
        startDate: site.startDate.split('T')[0],
        endDate: site.endDate.split('T')[0],
        progress: site.progress,
        status: site.status,
        projectId: site.projectId,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        address: '',
        startDate: '',
        endDate: '',
        progress: 0,
        status: SiteStatus.NOT_STARTED,
        projectId: defaultProjectId || 0,
      });
    }
    setErrors({});
  }, [site, isOpen, defaultProjectId]);

  const handleChange = (field: keyof CreateSiteData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.address?.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.startDate) newErrors.startDate = 'La date de début est requise';
    if (!formData.endDate) newErrors.endDate = 'La date de fin est requise';
    if (!formData.projectId) newErrors.projectId = 'Le projet est requis';

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Format dates to include time (YYYY-MM-DD HH:mm:ss)
      const dataToSubmit = {
        ...formData,
        startDate: formData.startDate ? `${formData.startDate} 00:00:00` : '',
        endDate: formData.endDate ? `${formData.endDate} 00:00:00` : '',
      } as CreateSiteData;

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error submitting site:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {site ? 'Modifier le chantier' : 'Nouveau chantier'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <Input
            label="Nom du chantier"
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="Ex: Chantier Route Nationale 1"
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description détaillée du chantier..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Address */}
          <Input
            label="Adresse"
            type="text"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            error={errors.address}
            required
            placeholder="Adresse complète du chantier"
          />

          {/* Project Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projet <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) => handleChange('projectId', parseInt(e.target.value))}
              className={`w-full px-4 py-2.5 rounded-lg border-2 ${
                errors.projectId ? 'border-red-500' : 'border-gray-200'
              } bg-white text-gray-900 focus:outline-none focus:border-primary transition-colors`}
            >
              <option value="">Sélectionner un projet</option>
              {projectsData?.data.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectCode} - {project.title}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              error={errors.startDate}
              required
            />
            <Input
              label="Date de fin"
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              error={errors.endDate}
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={formData.status || SiteStatus.NOT_STARTED}
              onChange={(e) => handleChange('status', e.target.value as SiteStatus)}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-primary transition-colors"
            >
              {SITE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progression ({formData.progress || 0}%)
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress || 0}
                onChange={(e) => handleChange('progress', parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${formData.progress || 0}%, #e5e7eb ${formData.progress || 0}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('progress', value)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      formData.progress === value
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {site ? 'Modification...' : 'Création...'}
              </>
            ) : (
              <>{site ? 'Modifier' : 'Créer'}</>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
