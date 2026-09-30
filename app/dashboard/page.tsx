'use client';

import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Building2,
  UserCircle2,
  FileText,
  ChevronRight,
  Plus,
  BarChart3,
  ClipboardList
} from 'lucide-react';

export default function DashboardPage() {
  const { isSuperAdmin, isAdmin } = usePermissions();
  const { session } = useAuth();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header différencié selon le rôle */}
        {isSuperAdmin() && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tableau de bord administrateur
            </h1>
            <p className="text-gray-600 mb-8">
              Vue d'ensemble de votre plateforme SaaS
            </p>
          </>
        )}

        {isAdmin() && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Tableau de bord
                </h1>
                {session?.tenant && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    {session.tenant.status}
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                Bienvenue sur votre espace de gestion de chantiers
              </p>
            </div>
          </>
        )}

        {/* Stats Grid - SUPER_ADMIN */}
        {isSuperAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Clients actifs',
                value: '0',
                icon: <Users className="w-6 h-6" />,
                color: 'bg-blue-500',
                link: '/tenants',
              },
              {
                title: 'Plans disponibles',
                value: '0',
                icon: <Package className="w-6 h-6" />,
                color: 'bg-purple-500',
                link: '/plans',
              },
              {
                title: 'Revenus mensuels',
                value: '0 €',
                icon: <DollarSign className="w-6 h-6" />,
                color: 'bg-green-500',
              },
              {
                title: 'Taux de croissance',
                value: '0%',
                icon: <TrendingUp className="w-6 h-6" />,
                color: 'bg-yellow-500',
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Link href={stat.link || '#'}>
                  <Card padding="md" hover>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg text-white`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Grid - ADMIN */}
        {isAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: 'Chantiers actifs',
                value: '0',
                subtitle: 'Projets en cours',
                icon: <Building2 className="w-6 h-6" />,
                bgGradient: 'from-blue-500 to-blue-600',
                iconBg: 'bg-blue-500/10',
                iconColor: 'text-blue-600',
                link: '/chantiers',
              },
              {
                title: 'Membres de l\'équipe',
                value: '0',
                subtitle: 'Utilisateurs actifs',
                icon: <UserCircle2 className="w-6 h-6" />,
                bgGradient: 'from-green-500 to-emerald-600',
                iconBg: 'bg-green-500/10',
                iconColor: 'text-green-600',
                link: '/users',
              },
              {
                title: 'Devis en attente',
                value: '0',
                subtitle: 'À valider',
                icon: <FileText className="w-6 h-6" />,
                bgGradient: 'from-amber-500 to-orange-600',
                iconBg: 'bg-amber-500/10',
                iconColor: 'text-amber-600',
                link: '/devis',
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <Link href={stat.link}>
                  <Card padding="lg" hover>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.iconBg} p-3 rounded-xl`}>
                        <div className={stat.iconColor}>
                          {stat.icon}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stat.subtitle}
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Content Cards - SUPER_ADMIN */}
        {isSuperAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Derniers clients
                  </h2>
                  <Link href="/tenants">
                    <Button variant="ghost" size="sm">
                      Voir tout
                    </Button>
                  </Link>
                </div>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Aucun client pour le moment</p>
                  <Link href="/tenants">
                    <Button variant="primary" size="sm" className="mt-4">
                      Créer un client
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Abonnements par plan
                  </h2>
                  <Link href="/plans">
                    <Button variant="ghost" size="sm">
                      Gérer
                    </Button>
                  </Link>
                </div>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Content Cards - ADMIN */}
        {isAdmin() && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Chantiers récents
                      </h2>
                    </div>
                    <Link href="/chantiers">
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">Aucun chantier actif</p>
                    <p className="text-gray-500 text-sm mb-4">Créez votre premier chantier pour commencer</p>
                    <Link href="/chantiers">
                      <Button variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Créer un chantier
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Tâches du jour
                      </h2>
                    </div>
                    <Link href="/planning">
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">Aucune tâche planifiée</p>
                    <p className="text-gray-500 text-sm mb-4">Organisez votre journée de travail</p>
                    <Link href="/planning">
                      <Button variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Créer une tâche
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
