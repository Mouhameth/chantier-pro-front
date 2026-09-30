'use client';

import { TenantWithDetails, TenantStatus } from '@/types/tenant';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface TenantCardProps {
  tenant: TenantWithDetails;
  index: number;
  onEdit: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onCancelSubscription: () => void;
  isSuspending: boolean;
  isActivating: boolean;
  isCancellingSubscription: boolean;
}

// Calculate days remaining
const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Calculate remaining percentage (how much time is left)
const calculateRemainingPercentage = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  const total = end.getTime() - start.getTime();
  const remaining = end.getTime() - now.getTime();

  if (total <= 0) return 0;
  if (remaining <= 0) return 0;
  if (remaining >= total) return 100;

  return Math.round((remaining / total) * 100);
};

export default function TenantCard({
  tenant,
  onEdit,
  onSuspend,
  onActivate,
  onCancelSubscription,
  isSuspending,
  isActivating,
  isCancellingSubscription,
}: TenantCardProps) {
  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case TenantStatus.TRIAL:
        return 'bg-blue-100 text-blue-800';
      case TenantStatus.SUSPENDED:
        return 'bg-yellow-100 text-yellow-800';
      case TenantStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'Actif';
      case TenantStatus.TRIAL:
        return 'Essai';
      case TenantStatus.SUSPENDED:
        return 'Suspendu';
      case TenantStatus.CANCELLED:
        return 'Annulé';
      default:
        return status;
    }
  };

  const getBillingCycleLabel = (cycle: 'monthly' | 'yearly') => {
    return cycle === 'monthly' ? 'Mensuel' : 'Annuel';
  };

  const subscription = tenant.subscription;
  const daysRemaining = subscription ? calculateDaysRemaining(subscription.currentPeriodEnd) : 0;
  const remainingPercentage = subscription ? calculateRemainingPercentage(subscription.currentPeriodStart, subscription.currentPeriodEnd) : 0;

  return (
    <Card padding="lg" hover>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900">
              {tenant.name}
            </h3>
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Modifier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500">@{tenant.slug}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            tenant.status
          )}`}
        >
          {getStatusLabel(tenant.status)}
        </span>
      </div>

      {/* Subscription Info */}
      {subscription && subscription.plan && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">{subscription.plan.name}</span>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
              {getBillingCycleLabel(subscription.billingCycle)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{daysRemaining} jours restants</span>
              <span>{remainingPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  daysRemaining < 7
                    ? 'bg-red-500'
                    : daysRemaining < 15
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${remainingPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Renouvellement le {new Date(subscription.nextBillingDate).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="truncate">{tenant.email}</span>
        </div>

        {tenant.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {tenant.phone}
          </div>
        )}

        {tenant.address && (
          <div className="flex items-start text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-2">{tenant.address}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        {tenant.status === TenantStatus.ACTIVE && (
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={onSuspend}
              disabled={isSuspending}
            >
              Suspendre
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={onCancelSubscription}
              disabled={isCancellingSubscription}
              className="hover:border-red-600 hover:bg-red-600 hover:text-white"
            >
              Annuler l&apos;abonnement
            </Button>
          </>
        )}

        {tenant.status === TenantStatus.SUSPENDED && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onActivate}
            disabled={isActivating}
          >
            Activer
          </Button>
        )}

        {tenant.status === TenantStatus.CANCELLED && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            disabled
          >
            Renouveler l&apos;abonnement
          </Button>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Créé le{' '}
          {new Date(tenant.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </Card>
  );
}
