'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';

const blueprintUploadSchema = z.object({
  siteId: z.number({
    required_error: 'Le chantier est requis',
    invalid_type_error: 'Sélectionnez un chantier',
  }),
  title: z.string().optional(),
  description: z.string().optional(),
});

type BlueprintUploadFormData = z.infer<typeof blueprintUploadSchema>;

interface Site {
  id: number;
  name: string;
  address: string;
}

interface BlueprintUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, data: BlueprintUploadFormData) => Promise<void>;
  sites: Site[];
  isLoading?: boolean;
}

export default function BlueprintUploadModal({
  isOpen,
  onClose,
  onSubmit,
  sites,
  isLoading = false,
}: BlueprintUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BlueprintUploadFormData>({
    resolver: zodResolver(blueprintUploadSchema),
  });

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setSelectedFile(null);
      setUploadError(null);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Seuls les fichiers PDF sont acceptés');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError('Le fichier est trop volumineux (max 50MB)');
      return;
    }

    setSelectedFile(file);

    // Auto-fill title if empty
    if (!selectedFile) {
      const fileName = file.name.replace('.pdf', '');
      setValue('title', fileName);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFormSubmit = async (data: BlueprintUploadFormData) => {
    if (!selectedFile) {
      setUploadError('Veuillez sélectionner un fichier PDF');
      return;
    }

    setUploadError(null);
    try {
      await onSubmit(selectedFile, data);
      handleClose();
    } catch (error) {
      setUploadError((error as Error).message || 'Erreur lors de l\'upload');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ajouter un plan"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier PDF <span className="text-red-500">*</span>
          </label>

          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
              ${selectedFile ? 'bg-green-50 border-green-300' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-1">
                  Glissez-déposez votre fichier PDF ici
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Parcourir
                </Button>
                <p className="text-xs text-gray-400 mt-3">
                  Taille maximale: 50 MB
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Site Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chantier <span className="text-red-500">*</span>
          </label>
          <select
            {...register('siteId', { valueAsNumber: true })}
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">Sélectionnez un chantier</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.address}
              </option>
            ))}
          </select>
          {errors.siteId && (
            <p className="mt-1 text-sm text-red-600">{errors.siteId.message}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <Input
            label="Titre du plan"
            placeholder="Ex: Plan RDC, Façade Nord..."
            {...register('title')}
            error={errors.title?.message}
          />
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
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploader le plan
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
