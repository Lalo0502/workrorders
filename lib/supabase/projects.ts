import { supabase } from "./client";
import { Project } from "@/types";

/**
 * Get all projects
 */
export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      clients:client_id(id, name, email, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single project by ID
 */
export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      clients:client_id(id, name, email, phone, company)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    throw error;
  }

  return data;
}

/**
 * Create a new project
 */
export async function createProject(project: Omit<Project, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("Error deleting project:", error);
    throw error;
  }

  return true;
}

/**
 * Get work orders for a specific project
 */
export async function getProjectWorkOrders(projectId: string) {
  const { data, error } = await supabase
    .from("work_orders")
    .select(`
      *,
      clients:client_id(name),
      work_order_technicians(
        technicians:technician_id(name)
      )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project work orders:", error);
    throw error;
  }

  return data || [];
}

/**
 * Remove work order from project (set project_id to null)
 */
export async function removeWorkOrderFromProject(workOrderId: string) {
  const { data, error } = await supabase
    .from("work_orders")
    .update({ project_id: null })
    .eq("id", workOrderId)
    .select()
    .single();

  if (error) {
    console.error("Error removing work order from project:", error);
    throw error;
  }

  return data;
}
