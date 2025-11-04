import { supabase } from './client'
import { WorkOrderChange } from '@/types'

// ============================================
// Log Change Functions
// ============================================

interface LogChangeParams {
  workOrderId: string
  changeType: WorkOrderChange['change_type']
  entityType?: string
  entityId?: string
  entityName?: string
  oldValue?: string
  newValue?: string
  notes?: string
}

/**
 * Logs a change to a work order
 */
export async function logWorkOrderChange(params: LogChangeParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('work_order_changes')
      .insert([{
        work_order_id: params.workOrderId,
        change_type: params.changeType,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        entity_name: params.entityName || null,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        notes: params.notes || null,
        changed_by: user?.id || null,
        changed_by_email: user?.email || null,
      }])

    if (error) {
      console.error('Error logging work order change:', error)
      // Don't throw - logging shouldn't break the main operation
    }
  } catch (error) {
    console.error('Error logging work order change:', error)
    // Don't throw - logging shouldn't break the main operation
  }
}

/**
 * Gets all changes for a work order
 */
export async function getWorkOrderChanges(workOrderId: string): Promise<WorkOrderChange[]> {
  const { data, error } = await supabase
    .from('work_order_changes')
    .select('*')
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching work order changes:', error)
    throw error
  }

  return data || []
}

/**
 * Gets change statistics for a work order
 */
export async function getWorkOrderChangeStats(workOrderId: string) {
  const { data, error } = await supabase
    .from('work_order_changes')
    .select('change_type, created_at')
    .eq('work_order_id', workOrderId)

  if (error) {
    console.error('Error fetching change stats:', error)
    return {
      totalChanges: 0,
      changeTypes: [],
      lastChange: null,
    }
  }

  const changeTypes = [...new Set(data.map(c => c.change_type))]
  const lastChange = data.length > 0 
    ? new Date(Math.max(...data.map(c => new Date(c.created_at).getTime())))
    : null

  return {
    totalChanges: data.length,
    changeTypes,
    lastChange,
  }
}

// ============================================
// Helper Functions for Specific Changes
// ============================================

export async function logTechnicianAdded(
  workOrderId: string,
  technicianId: string,
  technicianName: string,
  role?: string
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'technician_added',
    entityType: 'technician',
    entityId: technicianId,
    entityName: technicianName,
    newValue: role || 'No role specified',
  })
}

export async function logTechnicianRemoved(
  workOrderId: string,
  technicianId: string,
  technicianName: string
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'technician_removed',
    entityType: 'technician',
    entityId: technicianId,
    entityName: technicianName,
  })
}

export async function logTechnicianRoleChanged(
  workOrderId: string,
  technicianId: string,
  technicianName: string,
  oldRole: string | undefined,
  newRole: string
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'technician_role_changed',
    entityType: 'technician',
    entityId: technicianId,
    entityName: technicianName,
    oldValue: oldRole || 'No role',
    newValue: newRole || 'No role',
  })
}

export async function logMaterialAdded(
  workOrderId: string,
  materialId: string,
  materialName: string,
  quantity: number
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'material_added',
    entityType: 'material',
    entityId: materialId,
    entityName: materialName,
    newValue: `Quantity: ${quantity}`,
  })
}

export async function logMaterialRemoved(
  workOrderId: string,
  materialId: string,
  materialName: string,
  quantity: number
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'material_removed',
    entityType: 'material',
    entityId: materialId,
    entityName: materialName,
    oldValue: `Quantity: ${quantity}`,
  })
}

export async function logMaterialQuantityChanged(
  workOrderId: string,
  materialId: string,
  materialName: string,
  oldQuantity: number,
  newQuantity: number
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'material_quantity_changed',
    entityType: 'material',
    entityId: materialId,
    entityName: materialName,
    oldValue: oldQuantity.toString(),
    newValue: newQuantity.toString(),
  })
}

export async function logWorkOrderReopened(
  workOrderId: string,
  clearedEvidence: boolean
) {
  await logWorkOrderChange({
    workOrderId,
    changeType: 'work_order_reopened',
    entityType: 'work_order',
    notes: clearedEvidence 
      ? 'Work order reopened. Evidence was cleared.' 
      : 'Work order reopened. Evidence was kept.',
  })
}

/**
 * Logs changes when a work order is updated
 * Compares old and new values and logs each changed field
 */
export async function logWorkOrderUpdate(
  workOrderId: string,
  oldData: any,
  newData: any
) {
  const fieldLabels: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    work_type: 'Work Type',
    priority: 'Priority',
    status: 'Status',
    scheduled_date: 'Scheduled Date',
    scheduled_start_time: 'Start Time',
    scheduled_end_time: 'End Time',
    poc_name: 'Contact Name',
    poc_email: 'Contact Email',
    poc_phone: 'Contact Phone',
    poc_title: 'Contact Title',
    manual_address: 'Address',
    manual_city: 'City',
    manual_state: 'State',
    manual_zip_code: 'ZIP Code',
    client_id: 'Client',
    client_location_id: 'Location',
  }

  const promises: Promise<void>[] = []

  // Compare each field
  for (const key of Object.keys(newData)) {
    const oldValue = oldData[key]
    const newValue = newData[key]

    // Skip if values are the same
    if (oldValue === newValue) continue

    // Skip if both are empty
    if (!oldValue && !newValue) continue

    const fieldLabel = fieldLabels[key] || key
    let oldDisplayValue = oldValue ? String(oldValue) : '(empty)'
    let newDisplayValue = newValue ? String(newValue) : '(empty)'

    // Special handling for client_id - fetch client name
    if (key === 'client_id') {
      if (oldValue) {
        const { data: oldClient } = await supabase
          .from('clients')
          .select('name')
          .eq('id', oldValue)
          .single()
        oldDisplayValue = oldClient?.name || oldValue
      }
      if (newValue) {
        const { data: newClient } = await supabase
          .from('clients')
          .select('name')
          .eq('id', newValue)
          .single()
        newDisplayValue = newClient?.name || newValue
      }
    }

    // Special handling for client_location_id - fetch location name
    if (key === 'client_location_id') {
      if (oldValue) {
        const { data: oldLocation } = await supabase
          .from('client_locations')
          .select('location_name')
          .eq('id', oldValue)
          .single()
        oldDisplayValue = oldLocation?.location_name || oldValue
      }
      if (newValue) {
        const { data: newLocation } = await supabase
          .from('client_locations')
          .select('location_name')
          .eq('id', newValue)
          .single()
        newDisplayValue = newLocation?.location_name || newValue
      }
    }

    promises.push(
      logWorkOrderChange({
        workOrderId,
        changeType: 'field_updated',
        entityType: 'work_order',
        entityName: fieldLabel,
        oldValue: oldDisplayValue,
        newValue: newDisplayValue,
      })
    )
  }

  // Execute all logs in parallel
  await Promise.all(promises)
}
