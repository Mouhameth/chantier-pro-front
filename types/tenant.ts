export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}

export interface Tenant {
  id: string; // UUID
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: TenantStatus;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TenantAdmin {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface PaymentMethod {
  type: 'card';
  cardToken: string;
  cardLast4: string;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'discover';
  cardExpMonth: number;
  cardExpYear: number;
}

export interface CreateTenantData {
  // Tenant info
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;

  // Admin user info
  admin: TenantAdmin;

  // Subscription info
  planId: number;
  billingCycle: 'monthly' | 'yearly';

  // Payment info
  paymentMethod: PaymentMethod;
}

export interface UpdateTenantData {
  // Only tenant and admin info can be updated
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  admin?: Partial<TenantAdmin>;
}

export interface Subscription {
  id: number;
  tenantId: string;
  planId: number;
  startDate: string;
  endDate: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  cancelReason: string | null;
  createdBy: number;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  plan?: {
    id: number;
    name: string;
    description: string;
    priceMonthly: string;
    priceYearly: string;
    currency: string;
    maxUsers: number;
    maxProjects: number;
    maxSites: number;
  };
}

export interface TenantWithDetails extends Tenant {
  subscription?: Subscription;
  adminUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}
