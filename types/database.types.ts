// Este archivo será generado automáticamente por Supabase CLI
// o lo crearemos manualmente basándonos en tu schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          client_id: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          client_id: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          client_id?: string
          status?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          project_id: string
          status: string
          total: number
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          project_id: string
          status?: string
          total?: number
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          project_id?: string
          status?: string
          total?: number
        }
      }
      materials: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          sku: string | null
          category: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          sku?: string | null
          category?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          sku?: string | null
          category?: string | null
        }
      }
      work_order_materials: {
        Row: {
          id: string
          work_order_id: string
          material_id: string
          quantity: number
          price: number
          subtotal: number
        }
        Insert: {
          id?: string
          work_order_id: string
          material_id: string
          quantity: number
          price: number
          subtotal?: number
        }
        Update: {
          id?: string
          work_order_id?: string
          material_id?: string
          quantity?: number
          price?: number
          subtotal?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
