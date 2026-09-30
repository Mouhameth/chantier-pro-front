'use client';

import { Plan } from '@/types/plan';
import { TenantStatus } from '@/types/tenant';

interface TenantFiltersProps {
  plans: Plan[];
  selectedPlanId: number | null;
  onPlanChange: (planId: number | null) => void;
  selectedStatus: TenantStatus | null;
  onStatusChange: (status: TenantStatus | null) => void;
}

export default function TenantFilters({
  plans,
  selectedPlanId,
  onPlanChange,
  selectedStatus,
  onStatusChange,
}: TenantFiltersProps) {
  const statuses = [
    { value: TenantStatus.ACTIVE, label: 'Actif' },
    { value: TenantStatus.TRIAL, label: 'Essai' },
    { value: TenantStatus.SUSPENDED, label: 'Suspendu' },
    { value: TenantStatus.CANCELLED, label: 'Annulé' },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Filter by Plan */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Plan:</label>
        <select
          value={selectedPlanId || ''}
          onChange={(e) => onPlanChange(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white text-sm"
        >
          <option value="">Tous</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Status */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Statut:</label>
        <select
          value={selectedStatus || ''}
          onChange={(e) => onStatusChange(e.target.value ? (e.target.value as TenantStatus) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white text-sm"
        >
          <option value="">Tous</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
