import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/skills/mcp-trigger
 * Called by MCP server after a user adds/modifies tabular data
 * Determines sync direction and triggers bidirectional sync
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workos_user_id, skill_name } = body

    if (!workos_user_id || !skill_name) {
      return NextResponse.json(
        { error: 'workos_user_id and skill_name are required' },
        { status: 400 }
      )
    }

    console.log(`🔔 MCP trigger: user=${workos_user_id}, skill=${skill_name}`)

    // Query shared_skills table to find the matching record
    // Check both owner and recipient fields
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/shared_skills?status=eq.accepted&arca_table_name=eq.${skill_name}`,
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
      console.error('Failed to query shared_skills table')
      return NextResponse.json(
        { error: 'Failed to query shared skills' },
        { status: 500 }
      )
    }

    const sharedSkills = await response.json()

    if (!Array.isArray(sharedSkills) || sharedSkills.length === 0) {
      console.log(`⚠️ No accepted shared skill found for ${skill_name}`)
      return NextResponse.json({
        success: true,
        message: 'Skill is not shared, no sync needed'
      })
    }

    // Find the matching shared skill where this user is either owner or recipient
    const matchingShare = sharedSkills.find((share: any) => 
      share.owner_workos_user_id === workos_user_id || 
      share.shared_with_workos_user_id === workos_user_id
    )

    if (!matchingShare) {
      console.log(`⚠️ User ${workos_user_id} is not part of any share for ${skill_name}`)
      return NextResponse.json({
        success: true,
        message: 'User is not part of this shared skill'
      })
    }

    // Determine sync direction
    const isOwner = matchingShare.owner_workos_user_id === workos_user_id
    const direction = isOwner ? 'owner_to_recipient' : 'recipient_to_owner'

    console.log(`🔄 Determined sync direction: ${direction}`)
    console.log(`   Owner: ${matchingShare.owner_workos_user_id}`)
    console.log(`   Recipient: ${matchingShare.shared_with_workos_user_id}`)
    console.log(`   Triggered by: ${workos_user_id}`)

    // Trigger the appropriate sync endpoint based on skill type
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mio.fyi'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    
    const syncEndpoint = matchingShare.skill_type === 'vector' 
      ? `${cleanBaseUrl}/api/skills/sync-vector`
      : `${cleanBaseUrl}/api/skills/sync`

    console.log(`🔀 Using sync endpoint: ${syncEndpoint} (type: ${matchingShare.skill_type})`)

    const syncResponse = await fetch(syncEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shared_skill_id: matchingShare.id,
        direction
      })
    })

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text()
      console.error(`❌ Sync failed: ${errorText}`)
      return NextResponse.json(
        { error: 'Sync failed', details: errorText },
        { status: 500 }
      )
    }

    const syncResult = await syncResponse.json()
    console.log(`✅ Sync completed:`, syncResult)

    return NextResponse.json({
      success: true,
      message: 'Sync triggered successfully',
      direction,
      sync_result: syncResult
    })

  } catch (error) {
    console.error('Error in MCP trigger handler:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}