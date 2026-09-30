'use client';

import { motion } from 'framer-motion';
import { User, UserRole } from '@/types/auth';
import {
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  Shield,
  Briefcase,
  Calculator as Calc,
  Eye,
  HardHat,
  Ruler
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
    icon: <Shield className="w-4 h-4" />,
  },
  ADMIN: {
    label: 'Administrateur',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    icon: <Shield className="w-4 h-4" />,
  },
  PROJECT_MANAGER: {
    label: 'Chef de Projet',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    icon: <Briefcase className="w-4 h-4" />,
  },
  ACCOUNTANT: {
    label: 'Comptable',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 border-amber-200',
    icon: <Calc className="w-4 h-4" />,
  },
  SUPERVISOR: {
    label: 'Superviseur',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100 border-indigo-200',
    icon: <Eye className="w-4 h-4" />,
  },
  ARCHITECT: {
    label: 'Architecte',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100 border-pink-200',
    icon: <Ruler className="w-4 h-4" />,
  },
  TECHNICIAN: {
    label: 'Technicien',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-200',
    icon: <HardHat className="w-4 h-4" />,
  },
  MANAGER: {
    label: 'Manager',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100 border-teal-200',
    icon: <Briefcase className="w-4 h-4" />,
  },
};

export default function UserCard({ user, onEdit, onDelete, onToggleStatus }: UserCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const config = roleConfig[user.role] || roleConfig.TECHNICIAN;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    } catch {
      return 'Date invalide';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${
        user.isActive ? 'border-gray-200' : 'border-gray-300 opacity-75'
      }`}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            user.isActive
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          {user.isActive ? 'Actif' : 'Inactif'}
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10"
            >
              <button
                onClick={() => {
                  onEdit(user);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  onToggleStatus(user);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Power className="w-4 h-4" />
                {user.isActive ? 'Désactiver' : 'Activer'}
              </button>
              <div className="border-t border-gray-100 my-2" />
              <button
                onClick={() => {
                  onDelete(user);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Avatar & Name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-12 h-12 rounded-lg object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-base ring-2 ring-blue-100">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            {/* Online indicator if logged in recently */}
            {user.lastLoginAt &&
              new Date(user.lastLoginAt).getTime() > Date.now() - 30 * 60 * 1000 && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
              {user.firstName} {user.lastName}
            </h3>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.bgColor} ${config.color}`}>
              {config.icon}
              {config.label}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <span className="text-gray-700 truncate text-sm">{user.email}</span>
          </div>

          {user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                <Phone className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <span className="text-gray-700 text-xs">{user.phone}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Dernière connexion</span>
            </div>
            <span className="font-medium text-gray-700">
              {formatDate(user.lastLoginAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
