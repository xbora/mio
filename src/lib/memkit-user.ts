// Combined Supabase + Memkit user creation flow
import { createMemkitUser } from './memkit'
import { createOrGetSupabaseUser, updateSupabaseUser } from './supabase-users'
import { CreateUserParams, SupabaseUser } from './supabase'

interface UserSyncResult {
  success: boolean
  supabase_user: SupabaseUser | null
  memkit_workos_user_id: string | null
  error?: string
}

/**
 * Complete user creation flow: Supabase + Memkit
 * @param userData - User data from Mio WorkOS account
 * @returns Complete sync result with both Supabase and Memkit IDs
 */
export async function createCompleteUserAccount(userData: CreateUserParams): Promise<UserSyncResult> {
  try {
    console.log('🔄 Starting complete user creation flow for:', userData.workos_user_id)
    
    // Step 1: Create or get Supabase user (existing flow)
    const supabaseUser = await createOrGetSupabaseUser(userData)
    
    // Step 2: Create Memkit WorkOS user account
    const memkitResult = await createMemkitUser({
      email: userData.email || '',
      firstName: userData.first_name,
      lastName: userData.last_name,
      name: userData.name
    })
    
    if (!memkitResult.success || !memkitResult.workos_user_id) {
      console.error('❌ Failed to create Memkit user:', memkitResult.error)
      return {
        success: false,
        supabase_user: supabaseUser,
        memkit_workos_user_id: null,
        error: memkitResult.error || 'Memkit user creation failed'
      }
    }
    
    // Step 3: Update Supabase user with Memkit WorkOS user ID
    const updatedUser = await updateSupabaseUser(userData.workos_user_id, {
      memkit_workos_user_id: memkitResult.workos_user_id
    })
    
    if (!updatedUser) {
      console.error('❌ Failed to update Supabase user with Memkit ID')
      return {
        success: false,
        supabase_user: supabaseUser,
        memkit_workos_user_id: memkitResult.workos_user_id,
        error: 'Failed to save Memkit ID to Supabase'
      }
    }
    
    console.log('✅ Complete user account created successfully!')
    console.log(`   Mio WorkOS ID: ${userData.workos_user_id}`)
    console.log(`   Supabase ID: ${updatedUser.id}`)
    console.log(`   Memkit WorkOS ID: ${memkitResult.workos_user_id}`)
    
    return {
      success: true,
      supabase_user: updatedUser,
      memkit_workos_user_id: memkitResult.workos_user_id
    }
    
  } catch (error) {
    console.error('❌ Error in complete user creation flow:', error)
    return {
      success: false,
      supabase_user: null,
      memkit_workos_user_id: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}