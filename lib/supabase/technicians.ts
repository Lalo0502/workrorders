import { supabase } from './client'
import { Technician } from '@/types'

export async function getTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching technicians:', error)
    throw error
  }

  return data || []
}

export async function getTechnicianById(id: string): Promise<Technician | null> {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching technician:', error)
    throw error
  }

  return data
}

export async function createTechnician(technician: Omit<Technician, 'id' | 'created_at' | 'updated_at'>): Promise<Technician> {
  const { data, error } = await supabase
    .from('technicians')
    .insert([technician])
    .select()
    .single()

  if (error) {
    console.error('Error creating technician:', error)
    throw error
  }

  return data
}

export async function updateTechnician(id: string, technician: Partial<Omit<Technician, 'id' | 'created_at' | 'updated_at'>>): Promise<Technician> {
  const { data, error } = await supabase
    .from('technicians')
    .update(technician)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating technician:', error)
    throw error
  }

  return data
}

export async function deleteTechnician(id: string): Promise<void> {
  const { error } = await supabase
    .from('technicians')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting technician:', error)
    throw error
  }
}
