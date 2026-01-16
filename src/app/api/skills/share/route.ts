
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { getSupabaseUser } from '@/lib/supabase-users'
import { createSharedSkillInvite, checkSharedSkillExists } from '@/lib/supabase-shared-skills'
import { sendSkillInviteEmail } from '@/lib/resend'

/**
 * POST /api/skills/share
 * Create a skill share invitation
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now()
  console.log(`[SHARE_API] Request received at ${new Date().toISOString()}`)
  console.log(`[SHARE_API] Headers:`, {
    'user-agent': req.headers.get('user-agent'),
    'x-user-id': req.headers.get('x-user-id'),
    'content-type': req.headers.get('content-type')
  })
  
  try {
    // For testing: accept user_id from X-User-ID header
    const testUserId = req.headers.get('x-user-id')
    
    let userId: string
    
    if (testUserId) {
      // Testing mode: use provided user ID
      userId = testUserId
      console.log('🧪 Testing mode: using user_id from header:', userId)
    } else {
      // Production mode: use session auth
      const authStartTime = Date.now()
      const { user } = await withAuth()
      console.log(`[SHARE_API] Auth completed in ${Date.now() - authStartTime}ms`)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - provide X-User-ID header for testing or login' },
          { status: 401 }
        )
      }
      userId = user.id
    }
    
    // Create a user object for compatibility
    const user = { id: userId }

    // Parse request body
    const body = await req.json()
    const { skill_name, shared_with_email } = body
    console.log(`[SHARE_API] Payload:`, { skill_name, shared_with_email })

    if (!skill_name || !shared_with_email) {
      return NextResponse.json(
        { error: 'skill_name and shared_with_email are required' },
        { status: 400 }
      )
    }

    // Get owner's Supabase user
    const ownerLookupStart = Date.now()
    console.log(`[SHARE_API] Starting owner user lookup...`)
    const ownerUser = await getSupabaseUser(user.id)
    console.log(`[SHARE_API] Owner user lookup completed in ${Date.now() - ownerLookupStart}ms`)
    
    if (!ownerUser) {
      return NextResponse.json(
        { error: 'Owner user not found' },
        { status: 404 }
      )
    }

    // Check if owner has an Arca account
    if (!ownerUser.arca_workos_user_id) {
      return NextResponse.json(
        { error: 'Owner does not have an Arca account' },
        { status: 400 }
      )
    }

    // Verify skill exists and get its type from Arca API
    console.log(`[SHARE_API] Verifying skill "${skill_name}" exists in owner's Arca vault...`)
    const arcaSkillsResponse = await fetch('https://arca.build/api/v1/skills', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ownerUser.arca_workos_user_id}`
      }
    })

    if (!arcaSkillsResponse.ok) {
      console.error(`[SHARE_API] Failed to fetch skills from Arca: ${arcaSkillsResponse.status}`)
      return NextResponse.json(
        { error: 'Failed to verify skill with Arca' },
        { status: 500 }
      )
    }

    const arcaSkillsData = await arcaSkillsResponse.json()
    console.log(`[SHARE_API] Retrieved ${arcaSkillsData.skills?.length || 0} skills from Arca`)

    // Find the skill in the owner's vault
    const ownerSkill = arcaSkillsData.skills?.find(
      (s: any) => s.tableName === skill_name
    )

    if (!ownerSkill) {
      console.log(`[SHARE_API] Skill "${skill_name}" not found in owner's vault`)
      return NextResponse.json(
        { 
          error: `Skill "${skill_name}" does not exist in your Arca vault`,
          available_skills: arcaSkillsData.skills?.map((s: any) => s.tableName) || []
        },
        { status: 404 }
      )
    }

    // Map Arca's type to our schema ('table' -> 'tabular', 'vector' -> 'vector')
    const skillType: 'tabular' | 'vector' = ownerSkill.type === 'vector' ? 'vector' : 'tabular'
    console.log(`[SHARE_API] Skill "${skill_name}" verified as type: ${skillType}`)

    // Look up recipient by email
    const recipientLookupStart = Date.now()
    console.log(`[SHARE_API] Starting recipient lookup for email: ${shared_with_email}`)
    const recipientResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(shared_with_email)}`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!recipientResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to look up recipient user' },
        { status: 500 }
      )
    }

    const recipientData = await recipientResponse.json()
    console.log(`[SHARE_API] Recipient lookup completed in ${Date.now() - recipientLookupStart}ms`)
    
    if (!Array.isArray(recipientData) || recipientData.length === 0) {
      return NextResponse.json(
        { error: 'Recipient user not found. They must have a Mio account.' },
        { status: 404 }
      )
    }

    const recipientUser = recipientData[0]

    // Check if recipient has an Arca account
    if (!recipientUser.arca_workos_user_id) {
      return NextResponse.json(
        { error: 'Recipient does not have an Arca account yet' },
        { status: 400 }
      )
    }

    // Check if share already exists
    const existingShare = await checkSharedSkillExists(
      user.id,
      recipientUser.workos_user_id,
      skill_name
    )

    if (existingShare) {
      return NextResponse.json(
        { error: 'This skill is already shared with this user' },
        { status: 409 }
      )
    }

    // Create the shared skill invitation
    const sharedSkill = await createSharedSkillInvite({
      skill_name,
      owner_workos_user_id: user.id,
      shared_with_workos_user_id: recipientUser.workos_user_id,
      owner_arca_folder: ownerUser.arca_workos_user_id,
      shared_with_arca_folder: recipientUser.arca_workos_user_id,
      arca_table_name: skill_name,
      skill_type: skillType
    })

    // Send invitation email via Resend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mio.fyi'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const acceptUrl = `${cleanBaseUrl}/accept-share?token=${sharedSkill.invite_token}`
    
    console.log('✅ Shared skill invitation created:', sharedSkill.id)
    console.log('📧 Sending invitation email to:', shared_with_email)

    const emailStart = Date.now()
    console.log(`[SHARE_API] Sending invitation email to: ${shared_with_email}`)
    const emailResult = await sendSkillInviteEmail({
      recipientEmail: shared_with_email,
      recipientName: recipientUser.name || recipientUser.first_name,
      recipientAiName: recipientUser.ai_name,
      ownerName: ownerUser.name || ownerUser.first_name || 'Someone',
      skillName: skill_name,
      acceptUrl
    })
    console.log(`[SHARE_API] Email sending completed in ${Date.now() - emailStart}ms, success: ${emailResult.success}`)

    if (!emailResult.success) {
      console.error('⚠️ Email failed to send, but invitation was created:', emailResult.error)
    }

    const totalElapsed = Date.now() - requestStartTime
    console.log(`[SHARE_API] Sending response after ${totalElapsed}ms total`)

    return NextResponse.json({
      success: true,
      shared_skill: sharedSkill,
      accept_url: acceptUrl,
      email_sent: emailResult.success,
      email_id: emailResult.success ? emailResult.emailId : undefined,
      message: emailResult.success 
        ? 'Invitation created and email sent successfully'
        : 'Invitation created but email failed to send'
    })

  } catch (error) {
    console.error('Error creating skill share:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
