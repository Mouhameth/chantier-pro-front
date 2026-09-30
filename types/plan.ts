export interface PlanUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxUsers: number;
  maxProjects: number;
  maxSites: number;
  stripeProductId?: string | null;
  stripePriceMonthlyId?: string | null;
  stripePriceYearlyId?: string | null;
  createdBy: number;
  updatedBy: number | null;
  createdByUser?: PlanUser;
  updatedByUser?: PlanUser | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PlanWithStats extends Plan {
  _count: {
    subscriptions: number;
  };
}

export interface CreatePlanData {
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxUsers: number;
  maxProjects: number;
  maxSites: number;
  stripeProductId?: string;
  stripePriceMonthlyId?: string;
  stripePriceYearlyId?: string;
}

export interface UpdatePlanData extends Partial<CreatePlanData> {}
