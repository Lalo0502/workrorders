import { supabase } from "./client";
import { Material } from "@/types";

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching materials:", error);
    throw error;
  }

  return data || [];
}

export async function getMaterialById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching material:", error);
    throw error;
  }

  return data;
}

export async function createMaterial(
  material: Omit<Material, "id" | "created_at" | "updated_at">
): Promise<Material> {
  const { data, error } = await supabase
    .from("materials")
    .insert([material])
    .select()
    .single();

  if (error) {
    console.error("Error creating material:", error);
    throw error;
  }

  return data;
}

export async function updateMaterial(
  id: string,
  material: Partial<Omit<Material, "id" | "created_at" | "updated_at">>
): Promise<Material> {
  const { data, error } = await supabase
    .from("materials")
    .update(material)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating material:", error);
    throw error;
  }

  return data;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from("materials")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting material:", error);
    throw error;
  }
}

export async function getLowStockMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .filter("quantity_in_stock", "lte", "minimum_stock")
    .eq("active", true)
    .order("quantity_in_stock", { ascending: true });

  if (error) {
    console.error("Error fetching low stock materials:", error);
    throw error;
  }

  return data || [];
}

export async function getMaterialsByCategory(
  category: string
): Promise<Material[]> {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("category", category)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching materials by category:", error);
    throw error;
  }

  return data || [];
}
