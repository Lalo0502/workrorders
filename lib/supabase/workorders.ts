import { supabase } from './client'
import { WorkOrder, WorkOrderTechnician, WorkOrderMaterial } from '@/types'
import { logWorkOrderReopened } from './work-order-changes'

export async function getWorkOrders(): Promise<any[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      work_order_technicians(
        id,
        technician_id,
        role,
        technicians:technician_id(
          id,
          name,
          email,
          phone
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching work orders:', error)
    throw error
  }

  // Fetch projects separately for work orders that have project_id
  if (data && data.length > 0) {
    const projectIds = data
      .filter(wo => wo.project_id)
      .map(wo => wo.project_id)
    
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds)
      
      // Map projects to work orders
      const projectMap = new Map(projects?.map(p => [p.id, p]) || [])
      
      return data.map(wo => ({
        ...wo,
        projects: wo.project_id ? projectMap.get(wo.project_id) : null
      }))
    }
  }

  return data || []
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching work order:', error)
    throw error
  }

  // Fetch project if work order has project_id
  if (data && data.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description, status')
      .eq('id', data.project_id)
      .single()
    
    if (project) {
      (data as any).projects = project
    }
  }

  return data
}

export async function getWorkOrderByNumber(woNumber: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('wo_number', woNumber)
    .single()

  if (error) {
    console.error('Error fetching work order by number:', error)
    throw error
  }

  // Fetch project if work order has project_id
  if (data && data.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description, status')
      .eq('id', data.project_id)
      .single()
    
    if (project) {
      (data as any).projects = project
    }
  }

  return data
}

export async function createWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'wo_number'>): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .insert([workOrder])
    .select()
    .single()

  if (error) {
    console.error('Error creating work order:', error)
    throw error
  }

  return data
}

// Create work order with technicians and materials
export async function createCompleteWorkOrder(
  workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'wo_number'>,
  technicians: Array<{ technician_id: string; role?: string }>,
  materials: Array<{ material_id: string; quantity: number; notes?: string }>
): Promise<WorkOrder> {
  // Create the work order
  const createdWorkOrder = await createWorkOrder(workOrder)

  // Assign technicians if any
  if (technicians.length > 0) {
    await Promise.all(
      technicians.map((tech) =>
        assignTechnician(createdWorkOrder.id, tech.technician_id, tech.role)
      )
    )
  }

  // Add materials if any
  if (materials.length > 0) {
    await Promise.all(
      materials.map((mat) =>
        addMaterial(createdWorkOrder.id, mat.material_id, mat.quantity, mat.notes)
      )
    )
  }

  return createdWorkOrder
}

export async function updateWorkOrder(id: string, workOrder: Partial<Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'wo_number'>>): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update(workOrder)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating work order:', error)
    throw error
  }

  return data
}

export async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('work_orders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting work order:', error)
    throw error
  }
}

// ============================================
// Work Order Status Transitions
// ============================================

export async function startWorkOrder(id: string): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update({
      status: 'in_progress',
      actual_start_date: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error starting work order:', error)
    throw error
  }

  return data
}

export async function completeWorkOrder(
  id: string,
  data: {
    technician_notes?: string
    photos_before?: string[]
    photos_after?: string[]
    client_signature?: string
    client_signature_name?: string
  }
): Promise<WorkOrder> {
  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .update({
      status: 'completed',
      actual_end_date: new Date().toISOString(),
      ...data,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error completing work order:', error)
    throw error
  }

  return workOrder
}

export async function cancelWorkOrder(
  id: string,
  reason?: string
): Promise<WorkOrder> {
  const updateData: any = {
    status: 'cancelled',
  }

  if (reason) {
    updateData.technician_notes = reason
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error cancelling work order:', error)
    throw error
  }

  return data
}

export async function putOnHoldWorkOrder(
  id: string,
  reason?: string
): Promise<WorkOrder> {
  const updateData: any = {
    status: 'on_hold',
  }

  if (reason) {
    updateData.technician_notes = reason
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error putting work order on hold:', error)
    throw error
  }

  return data
}

export async function reopenWorkOrder(
  id: string,
  clearEvidence: boolean = false
): Promise<WorkOrder> {
  const updateData: any = {
    status: 'in_progress',
    actual_end_date: null, // Clear completion date
  }

  // Optionally clear all evidence
  if (clearEvidence) {
    updateData.photos_before = null
    updateData.photos_after = null
    updateData.technician_notes = null
    updateData.client_signature = null
    updateData.client_signature_name = null
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error reopening work order:', error)
    throw error
  }

  // Log the reopen action (non-blocking)
  await logWorkOrderReopened(id, clearEvidence)

  return data
}

// ============================================
// Work Order Technicians
// ============================================

export async function getWorkOrderTechnicians(workOrderId: string): Promise<WorkOrderTechnician[]> {
  const { data, error } = await supabase
    .from('work_order_technicians')
    .select('*')
    .eq('work_order_id', workOrderId)

  if (error) {
    console.error('Error fetching work order technicians:', error)
    throw error
  }

  return data || []
}

export async function getWorkOrderTechniciansWithDetails(workOrderId: string) {
  const { data, error } = await supabase
    .from('work_order_technicians')
    .select(`
      technician_id,
      role,
      technicians:technician_id (
        id,
        name,
        email,
        phone,
        photo_url,
        hire_date,
        active
      )
    `)
    .eq('work_order_id', workOrderId)

  if (error) {
    console.error('Error fetching work order technicians with details:', error)
    throw error
  }

  return data || []
}

export async function assignTechnician(workOrderId: string, technicianId: string, role?: string): Promise<WorkOrderTechnician> {
  const { data, error } = await supabase
    .from('work_order_technicians')
    .insert([{ work_order_id: workOrderId, technician_id: technicianId, role }])
    .select()
    .single()

  if (error) {
    console.error('Error assigning technician:', error)
    throw error
  }

  return data
}

export async function removeTechnician(workOrderId: string, technicianId: string): Promise<void> {
  const { error } = await supabase
    .from('work_order_technicians')
    .delete()
    .eq('work_order_id', workOrderId)
    .eq('technician_id', technicianId)

  if (error) {
    console.error('Error removing technician:', error)
    throw error
  }
}

// ============================================
// Work Order Materials
// ============================================

export async function getWorkOrderMaterials(workOrderId: string): Promise<WorkOrderMaterial[]> {
  const { data, error } = await supabase
    .from('work_order_materials')
    .select('*')
    .eq('work_order_id', workOrderId)

  if (error) {
    console.error('Error fetching work order materials:', error)
    throw error
  }

  return data || []
}

export async function getWorkOrderMaterialsWithDetails(workOrderId: string) {
  const { data, error } = await supabase
    .from('work_order_materials')
    .select(`
      material_id,
      quantity,
      notes,
      materials:material_id (
        id,
        name,
        sku,
        description,
        unit_of_measure,
        category,
        active
      )
    `)
    .eq('work_order_id', workOrderId)

  if (error) {
    console.error('Error fetching work order materials with details:', error)
    throw error
  }

  return data || []
}

export async function addMaterial(workOrderId: string, materialId: string, quantity: number, notes?: string): Promise<WorkOrderMaterial> {
  const { data, error } = await supabase
    .from('work_order_materials')
    .insert([{ work_order_id: workOrderId, material_id: materialId, quantity, notes }])
    .select()
    .single()

  if (error) {
    console.error('Error adding material:', error)
    throw error
  }

  return data
}

export async function updateMaterial(id: string, quantity: number, notes?: string): Promise<WorkOrderMaterial> {
  const { data, error } = await supabase
    .from('work_order_materials')
    .update({ quantity, notes })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating material:', error)
    throw error
  }

  return data
}

export async function removeMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('work_order_materials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing material:', error)
    throw error
  }
}
