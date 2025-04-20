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
      users: {
        Row: {
          id: string
          device_id: string
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          items: Json
          total_amount: number
          status: string
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          items: Json
          total_amount: number
          status?: string
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          items?: Json
          total_amount?: number
          status?: string
          scheduled_for?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      order_history: {
        Row: {
          id: string
          order_id: string
          status_change: string
          timestamp: string
        }
        Insert: {
          id?: string
          order_id: string
          status_change: string
          timestamp?: string
        }
        Update: {
          id?: string
          order_id?: string
          status_change?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
}