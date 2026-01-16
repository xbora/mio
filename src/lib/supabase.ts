// Supabase configuration with validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!SUPABASE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Headers for Supabase requests
export const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
}

export { SUPABASE_URL }

// Types for our user data
export interface SupabaseUser {
  id?: string
  workos_user_id: string
  email?: string
  name?: string
  first_name?: string
  last_name?: string
  created_at?: string
  updated_at?: string
  daily_calorie_goal?: number
  current_weight?: number
  goal_weight?: number
  weekly_loss_goal?: number
  whatsapp_number?: string
  memkit_workos_user_id?: string
  arca_workos_user_id?: string
  ai_name?: string
  ai_username?: string
}

export interface CreateUserParams {
  workos_user_id: string
  email?: string
  name?: string
  first_name?: string
  last_name?: string
  daily_calorie_goal?: number
  memkit_workos_user_id?: string
  whatsapp_number?: string
}

// Shared skills types
export interface SharedSkill {
  id: string
  skill_name: string
  owner_workos_user_id: string
  shared_with_workos_user_id: string
  owner_arca_folder: string
  shared_with_arca_folder: string
  arca_table_name: string
  status: 'pending' | 'accepted' | 'rejected'
  invite_token: string
  invite_sent_at?: string
  invite_accepted_at?: string
  created_at?: string
  updated_at?: string
}

// API response types
export interface SupabaseApiResponse<T = any> {
  data?: T
  error?: string
  details?: string
}