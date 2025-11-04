/**
 * Project-related type definitions
 */

export interface Project {
  id: string;
  created_at: string;
  name: string;
  description?: string | null;
  client_id?: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string | null;
  end_date?: string | null;
  estimated_completion_date?: string | null;
}

export type ProjectStatus = Project['status'];
