import { SUPABASE_URL, HEADERS, SupabaseUser, CreateUserParams, SupabaseApiResponse } from './supabase'

/**
 * Check if a user exists in Supabase by WorkOS user ID
 */
export async function checkUserExists(workosUserId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${workosUserId}`,
      {
        method: 'GET',
        headers: HEADERS
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return Array.isArray(data) && data.length > 0
  } catch (error) {
    console.error('Error checking if user exists:', error)
    throw error
  }
}

/**
 * Get a user from Supabase by WorkOS user ID
 */
export async function getSupabaseUser(workosUserId: string): Promise<SupabaseUser | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${workosUserId}`,
      {
        method: 'GET',
        headers: HEADERS
      }
    )
    
    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }
    
    return data[0] as SupabaseUser
  } catch (error) {
    console.error('Error getting Supabase user:', error)
    throw error
  }
}

/**
 * Create a new user in Supabase
 */
export async function createSupabaseUser(params: CreateUserParams): Promise<SupabaseUser> {
  try {
    // First check if user already exists
    const existingUser = await getSupabaseUser(params.workos_user_id)
    if (existingUser) {
      console.log(`User with WorkOS ID ${params.workos_user_id} already exists`)
      return existingUser
    }
    
    // Prepare user data - only include fields that exist in your table
    const userData = {
      workos_user_id: params.workos_user_id,
      email: params.email || null,
      name: params.name || null,
      first_name: params.first_name || null,
      last_name: params.last_name || null
      // Note: daily_calorie_goal removed since it doesn't exist in your table schema
    }
    
    // Create the user
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users`,
      {
        method: 'POST',
        headers: {
          ...HEADERS,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(userData)
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create user: ${response.status} ${errorText}`)
    }
    
    const data = await response.json()
    const newUser = Array.isArray(data) ? data[0] : data
    
    console.log(`✅ Created Supabase user for WorkOS ID: ${params.workos_user_id}`)
    return newUser as SupabaseUser
    
  } catch (error) {
    console.error('Error creating Supabase user:', error)
    throw error
  }
}

/**
 * Create or get existing user in Supabase (idempotent operation)
 */
export async function createOrGetSupabaseUser(params: CreateUserParams): Promise<SupabaseUser> {
  try {
    // First try to get existing user
    const existingUser = await getSupabaseUser(params.workos_user_id)
    if (existingUser) {
      console.log(`Found existing Supabase user for WorkOS ID: ${params.workos_user_id}`)
      return existingUser
    }
    
    // If user doesn't exist, create them
    return await createSupabaseUser(params)
  } catch (error) {
    console.error('Error in createOrGetSupabaseUser:', error)
    throw error
  }
}

/**
 * Update user profile information
 */
export async function updateSupabaseUser(
  workosUserId: string, 
  updates: Partial<CreateUserParams> & { ai_name?: string; ai_username?: string }
): Promise<SupabaseUser | null> {
  try {
    // First get the user to make sure they exist
    const existingUser = await getSupabaseUser(workosUserId)
    if (!existingUser) {
      console.error(`User not found for WorkOS ID: ${workosUserId}`)
      return null
    }
    
    // Build update data
    const updateData: any = {}
    
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.first_name !== undefined) updateData.first_name = updates.first_name
    if (updates.last_name !== undefined) updateData.last_name = updates.last_name
    if (updates.daily_calorie_goal !== undefined) updateData.daily_calorie_goal = updates.daily_calorie_goal
    if (updates.memkit_workos_user_id !== undefined) updateData.memkit_workos_user_id = updates.memkit_workos_user_id
    if (updates.whatsapp_number !== undefined) updateData.whatsapp_number = updates.whatsapp_number
    if (updates.ai_name !== undefined) updateData.ai_name = updates.ai_name
    if (updates.ai_username !== undefined) updateData.ai_username = updates.ai_username
    
    if (Object.keys(updateData).length === 0) {
      console.log('No fields to update')
      return existingUser
    }
    
    // Update the user
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${workosUserId}`,
      {
        method: 'PATCH',
        headers: {
          ...HEADERS,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update user: ${response.status} ${errorText}`)
    }
    
    const data = await response.json()
    const updatedUser = Array.isArray(data) ? data[0] : data
    
    console.log(`✅ Updated Supabase user for WorkOS ID: ${workosUserId}`)
    return updatedUser as SupabaseUser
    
  } catch (error) {
    console.error('Error updating Supabase user:', error)
    throw error
  }
}