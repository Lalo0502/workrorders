import { supabase } from "./client"
import { ClientLocation } from "@/types"

export async function getLocationsByClient(clientId: string) {
  const { data, error } = await supabase
    .from("client_locations")
    .select("*")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("location_name", { ascending: true })

  if (error) {
    console.error("Error fetching locations:", error)
    throw error
  }

  return data as ClientLocation[]
}

export async function getLocationById(id: string) {
  const { data, error } = await supabase
    .from("client_locations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching location:", error)
    throw error
  }

  return data as ClientLocation
}

export async function createLocation(
  location: Omit<ClientLocation, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("client_locations")
    .insert([location])
    .select()
    .single()

  if (error) {
    console.error("Error creating location:", error)
    throw error
  }

  return data as ClientLocation
}

export async function updateLocation(
  id: string,
  location: Partial<ClientLocation>
) {
  const { data, error } = await supabase
    .from("client_locations")
    .update(location)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating location:", error)
    throw error
  }

  return data as ClientLocation
}

export async function deleteLocation(id: string) {
  // Hard delete - permanently remove location
  const { error } = await supabase
    .from("client_locations")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting location:", error)
    throw error
  }

  return true
}

export async function setPrimaryLocation(clientId: string, locationId: string) {
  // First, set all locations for this client to non-primary
  const { error: resetError } = await supabase
    .from("client_locations")
    .update({ is_primary: false })
    .eq("client_id", clientId)

  if (resetError) {
    console.error("Error resetting primary locations:", resetError)
    throw resetError
  }

  // Then set the selected location as primary
  const { data, error } = await supabase
    .from("client_locations")
    .update({ is_primary: true })
    .eq("id", locationId)
    .select()
    .single()

  if (error) {
    console.error("Error setting primary location:", error)
    throw error
  }

  return data as ClientLocation
}
