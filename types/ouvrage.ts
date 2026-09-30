export interface OuvrageCategory {
  id: number;
  title: string;
  color: string;
  icon?: string;
  description?: string;
  order: number;
  items?: OuvrageItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OuvrageItem {
  id: number;
  categoryId: number;
  title: string;
  unit: string; // u, ml, m², m³, etc.
  unitPrice?: number;
  color?: string;
  description?: string;
  reference?: string;
  icon?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOuvrageCategoryData {
  title: string;
  color: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface UpdateOuvrageCategoryData {
  title?: string;
  color?: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface CreateOuvrageItemData {
  categoryId: number;
  title: string;
  unit: string;
  unitPrice?: number;
  color?: string;
  description?: string;
  reference?: string;
  icon?: string;
  order?: number;
}

export interface UpdateOuvrageItemData {
  title?: string;
  unit?: string;
  unitPrice?: number;
  color?: string;
  description?: string;
  reference?: string;
  icon?: string;
  order?: number;
}

export interface OuvrageCategoriesListResponse {
  success: boolean;
  data: OuvrageCategory[];
  count: number;
}
