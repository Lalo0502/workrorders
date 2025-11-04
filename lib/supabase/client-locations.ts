import { supabase } from './client'
import { ClientLocation } from '@/types'

export async function getClientLocations(clientId: string): Promise<ClientLocation[]> {
  const { data, error } = await supabase
    .from('client_locations')
    .select('*')
    .eq('client_id', clientId)
    .order('is_primary', { ascending: false })

  if (error) {
    console.error('Error fetching client locations:', error)
    throw error
  }

  return data || []
}

export async function getClientLocationById(id: string): Promise<ClientLocation | null> {
  const { data, error } = await supabase
    .from('client_locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client location:', error)
    throw error
  }

  return data
}
