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
      tenants: {
        Row: {
          id: string
          name: string
          near_expiry_days: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          near_expiry_days?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          near_expiry_days?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          role: 'admin' | 'staff'
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          role?: 'admin' | 'staff'
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          role?: 'admin' | 'staff'
          email?: string
          name?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          sku: string
          name: string
          brand: string | null
          barcode: string | null
          critical_stock_level: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          sku: string
          name: string
          brand?: string | null
          barcode?: string | null
          critical_stock_level?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          sku?: string
          name?: string
          brand?: string | null
          barcode?: string | null
          critical_stock_level?: number
          created_at?: string
        }
      }
      stock_batches: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          batch_no: string
          qty_on_hand: number
          purchase_price: number
          sale_price: number
          expiry_date: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          batch_no: string
          qty_on_hand?: number
          purchase_price: number
          sale_price: number
          expiry_date: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          batch_no?: string
          qty_on_hand?: number
          purchase_price?: number
          sale_price?: number
          expiry_date?: string
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          tenant_id: string
          supplier_name: string
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          supplier_name: string
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          supplier_name?: string
          total_amount?: number
          created_at?: string
        }
      }
      purchase_lines: {
        Row: {
          id: string
          purchase_id: string
          product_id: string
          batch_id: string
          qty: number
          purchase_price: number
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id: string
          batch_id: string
          qty: number
          purchase_price: number
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string
          batch_id?: string
          qty?: number
          purchase_price?: number
        }
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          total_amount?: number
          created_at?: string
        }
      }
      sale_lines: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          batch_id: string
          qty: number
          unit_price: number
          line_total: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          batch_id: string
          qty: number
          unit_price: number
          line_total: number
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string
          batch_id?: string
          qty?: number
          unit_price?: number
          line_total?: number
        }
      }
      accounting_entries: {
        Row: {
          id: string
          tenant_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          note?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          payload?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          tenant_id: string
          type: string
          message: string
          status: 'unread' | 'read'
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          type?: string
          message: string
          status?: 'unread' | 'read'
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          type?: string
          message?: string
          status?: 'unread' | 'read'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_fifo_batch: {
        Args: {
          p_tenant_id: string
          p_product_id: string
          p_qty: number
        }
        Returns: {
          batch_id: string
          batch_no: string
          available_qty: number
          purchase_price: number
          sale_price: number
          expiry_date: string
        }[]
      }
      deduct_stock: {
        Args: {
          p_batch_id: string
          p_qty: number
        }
        Returns: boolean
      }
      check_expiring_batches: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

