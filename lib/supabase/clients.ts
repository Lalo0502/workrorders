import { supabase } from "./client"
import { Client } from "@/types"

export async function getClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    throw error
  }

  return data as Client[]
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching client:", error)
    throw error
  }

  return data as Client
}

export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("clients")
    .insert([client])
    .select()
    .single()

  if (error) {
    console.error("Error creating client:", error)
    throw error
  }

  return data as Client
}

export async function updateClient(id: string, client: Partial<Client>) {
  const { data, error } = await supabase
    .from("clients")
    .update(client)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating client:", error)
    throw error
  }

  return data as Client
}

export async function deleteClient(id: string) {
  // Hard delete - permanently remove client and cascade to locations
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting client:", error)
    throw error
  }

  return true
}
