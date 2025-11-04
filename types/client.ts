/**
 * Client-related type definitions
 */

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  industry?: string | null;
  website?: string | null;
  notes?: string | null;
  active: boolean;
}

export interface ClientLocation {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  location_name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  poc_name?: string | null;
  poc_email?: string | null;
  poc_phone?: string | null;
  poc_title?: string | null;
  is_primary: boolean;
  active: boolean;
  notes?: string | null;
}
