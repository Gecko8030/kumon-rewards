import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'kumon-rewards-app'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          email: string
          name: string
          level: string
          avatar_url: string | null
          kumon_dollars: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          level: string
          avatar_url?: string | null
          kumon_dollars?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          level?: string
          avatar_url?: string | null
          kumon_dollars?: number
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string
          cost: number
          image_url: string | null
          category: string
          available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          cost: number
          image_url?: string | null
          category: string
          available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          cost?: number
          image_url?: string | null
          category?: string
          available?: boolean
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          student_id: string
          reward_id: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          reward_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          reward_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          student_id: string
          amount: number
          type: 'earned' | 'spent'
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          type: 'earned' | 'spent'
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          amount?: number
          type?: 'earned' | 'spent'
          description?: string
          created_at?: string
        }
      }
      admin: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
    }
  }
}