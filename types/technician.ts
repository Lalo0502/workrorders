/**
 * Technician-related type definitions
 */

export interface Technician {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  hire_date?: string | null;
  active: boolean;
}
