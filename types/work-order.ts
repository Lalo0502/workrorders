/**
 * Work Order-related type definitions
 */

export interface WorkOrder {
  id: string;
  created_at: string;
  updated_at: string;
  wo_number: string;
  title: string;
  description?: string | null;
  status: 'draft' | 'scheduled' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  work_type: 'installation' | 'maintenance' | 'repair' | 'inspection' | 'other';
  
  // Relationships
  client_id: string;
  project_id?: string | null;
  client_location_id?: string | null;
  
  // Manual address
  manual_address?: string | null;
  manual_city?: string | null;
  manual_state?: string | null;
  manual_zip_code?: string | null;
  manual_country?: string | null;
  
  // Point of Contact (POC)
  poc_name?: string | null;
  poc_email?: string | null;
  poc_phone?: string | null;
  poc_title?: string | null;
  
  // Dates
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  
  // Evidence
  photos_before?: string[] | null;
  photos_after?: string[] | null;
  technician_notes?: string | null;
  client_signature?: string | null;
  client_signature_name?: string | null;
  
  // Audit
  created_by?: string | null;
  completed_by?: string | null;
}

export interface WorkOrderTechnician {
  id: string;
  work_order_id: string;
  technician_id: string;
  assigned_at: string;
  role?: string | null;
}

export interface WorkOrderMaterial {
  id: string;
  work_order_id: string;
  material_id: string;
  quantity: number;
  notes?: string | null;
  added_at: string;
  added_by?: string | null;
}

export interface WorkOrderChange {
  id: string;
  created_at: string;
  work_order_id: string;
  change_type: 
    | 'technician_added'
    | 'technician_removed'
    | 'technician_role_changed'
    | 'material_added'
    | 'material_removed'
    | 'material_quantity_changed'
    | 'material_notes_changed'
    | 'status_changed'
    | 'field_updated'
    | 'work_order_reopened'
    | 'work_order_cancelled'
    | 'work_order_completed';
  entity_type?: string | null;
  entity_id?: string | null;
  entity_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  notes?: string | null;
  changed_by?: string | null;
  changed_by_email?: string | null;
}

// Type aliases for better type safety
export type WorkOrderStatus = WorkOrder['status'];
export type WorkOrderPriority = WorkOrder['priority'];
export type WorkOrderType = WorkOrder['work_type'];
export type WorkOrderChangeType = WorkOrderChange['change_type'];
