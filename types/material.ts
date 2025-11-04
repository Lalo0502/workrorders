/**
 * Material/Parts-related type definitions
 */

export interface Material {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  sku?: string | null;
  part_number?: string | null;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  type?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  specifications?: string | null;
  unit_of_measure: string;
  quantity_in_stock: number;
  minimum_stock: number;
  location?: string | null;
  unit_cost?: number | null;
  unit_price?: number | null;
  supplier?: string | null;
  active: boolean;
  notes?: string | null;
}

export type MaterialCategory = Material['category'];
export type MaterialUnitOfMeasure = Material['unit_of_measure'];
