import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { getSupabaseUser } from '@/lib/supabase-users'

/**
 * API route to securely get the current user's phone number
 * This ensures users can only access their own data
 */
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user from WorkOS
    const { user } = await withAuth()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Fetch the user's data from Supabase using their WorkOS ID
    const supabaseUser = await getSupabaseUser(user.id)
    
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return only the phone number data
    return NextResponse.json({
      whatsapp_number: supabaseUser.whatsapp_number || null,
      verified: !!supabaseUser.whatsapp_number
    })

  } catch (error) {
    console.error('Error fetching user phone data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}