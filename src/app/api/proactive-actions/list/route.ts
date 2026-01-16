
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get workos_user_id from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const workos_user_id = authHeader.replace('Bearer ', '')

    // Fetch user's proactive actions from Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/proactive_actions?user_id=eq.${workos_user_id}&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch proactive actions:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch proactive actions', details: errorText },
        { status: 500 }
      )
    }

    const actions = await response.json()

    return NextResponse.json({
      success: true,
      data: actions
    })

  } catch (error) {
    console.error('Error fetching proactive actions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
