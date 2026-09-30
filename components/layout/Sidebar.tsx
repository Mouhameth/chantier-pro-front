'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { usePermissions } from '@/hooks/usePermissions';
import { useMemo } from 'react';
import {
  Home,
  Users,
  Package,
  UserCircle2,
  FolderOpen,
  Building2,
  Calculator,
  FileText,
  Receipt,
  Calendar,
  DollarSign
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // If not specified, available to all
}

const allNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  // SUPER_ADMIN routes
  {
    name: 'Clients',
    href: '/tenants',
    roles: ['SUPER_ADMIN'],
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Plans',
    href: '/plans',
    roles: ['SUPER_ADMIN'],
    icon: <Package className="w-5 h-5" />,
  },
  // ADMIN routes
  {
    name: 'Utilisateurs',
    href: '/users',
    roles: ['ADMIN'],
    icon: <UserCircle2 className="w-5 h-5" />,
  },
  {
    name: 'Projets',
    href: '/projects',
    roles: ['ADMIN'],
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    name: 'Chantiers',
    href: '/chantiers',
    roles: ['ADMIN'],
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    name: 'Métrés',
    href: '/metres',
    roles: ['ADMIN'],
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    name: 'Devis',
    href: '/devis',
    roles: ['ADMIN'],
    icon: <FileText className="w-5 h-5" />,
  },
  {
    name: 'Factures',
    href: '/factures',
    roles: ['ADMIN'],
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    name: 'Planning',
    href: '/planning',
    roles: ['ADMIN'],
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    name: 'Comptabilité',
    href: '/comptabilite',
    roles: ['ADMIN'],
    icon: <DollarSign className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userRole } = usePermissions();

  // Filter navigation items based on user role
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      // If no roles specified, available to all
      if (!item.roles) return true;
      // Otherwise check if user's role is in the allowed roles
      return item.roles.includes(userRole || '');
    });
  }, [userRole]);

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="ChantierPro Logo"
            width={120}
            height={1}
            priority
            className="object-contain"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                  ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Besoin d&apos;aide ?
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Consultez notre documentation
          </p>
          <button className="w-full text-xs bg-white text-primary hover:bg-gray-50 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer">
            En savoir plus
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
