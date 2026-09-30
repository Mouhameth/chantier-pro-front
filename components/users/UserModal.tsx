'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, Briefcase, Calculator, Eye, Ruler, HardHat, ChevronDown } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { User, UserRole, CreateUserData } from '@/types/auth';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
}

const creatableRoles = [
  {
    value: UserRole.ADMIN,
    label: 'Administrateur',
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  {
    value: UserRole.PROJECT_MANAGER,
    label: 'Chef de Projet',
    icon: Briefcase,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  {
    value: UserRole.ACCOUNTANT,
    label: 'Comptable',
    icon: Calculator,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  {
    value: UserRole.SUPERVISOR,
    label: 'Superviseur',
    icon: Eye,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
  },
  {
    value: UserRole.ARCHITECT,
    label: 'Architecte',
    icon: Ruler,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
  },
  {
    value: UserRole.TECHNICIAN,
    label: 'Technicien',
    icon: HardHat,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
];

export default function UserModal({ isOpen, onClose, onSubmit, user, isLoading }: UserModalProps) {
  const [formData, setFormData] = useState<Omit<CreateUserData, 'password'>>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.TECHNICIAN,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Omit<CreateUserData, 'password'>, string>>>({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role as UserRole,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: UserRole.PROJECT_MANAGER,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('[data-role-dropdown]')) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isRoleDropdownOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<CreateUserData, 'password'>, string>> = {};

    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Prénom requis (min 2 caractères)';
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Nom requis (min 2 caractères)';
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(formData as CreateUserData);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleChange = (field: keyof Omit<CreateUserData, 'password'>, value: string | UserRole) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={'userModal'}>
      <div className="relative">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Jean"
                error={errors.firstName}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Dupont"
                error={errors.lastName}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jean.dupont@exemple.com"
              error={errors.email}
              disabled={isLoading}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+221 77 123 45 67"
              error={errors.phone}
              disabled={isLoading}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle <span className="text-red-500">*</span>
            </label>
            <div className="relative" data-role-dropdown>
              {/* Select Trigger */}
              <button
                type="button"
                onClick={() => !isLoading && setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                  isRoleDropdownOpen
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    creatableRoles.find(r => r.value === formData.role)?.bgColor || 'bg-gray-100'
                  }`}>
                    {(() => {
                      const Icon = creatableRoles.find(r => r.value === formData.role)?.icon || Briefcase;
                      return <Icon className={`w-4 h-4 ${
                        creatableRoles.find(r => r.value === formData.role)?.color || 'text-gray-600'
                      }`} />;
                    })()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {creatableRoles.find(r => r.value === formData.role)?.label || 'Sélectionner un rôle'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                  isRoleDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 py-2 max-h-64 overflow-y-auto">
                  {creatableRoles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          handleChange('role', role.value);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                          formData.role === role.value
                            ? `${role.bgColor} ${role.color}`
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          formData.role === role.value ? 'bg-white/50' : role.bgColor
                        }`}>
                          <Icon className={`w-4 h-4 ${role.color}`} />
                        </div>
                        <span className="text-sm font-medium">{role.label}</span>
                        {formData.role === role.value && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-current" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {user ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>{user ? 'Modifier' : 'Créer'}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
