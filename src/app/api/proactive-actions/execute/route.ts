import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabase-users'
import { SUPABASE_URL, HEADERS } from '@/lib/supabase'

const SMS_WHATSAPP_WEBHOOK = 'https://flow.a.gentic.dev/webhook/cloe21e2-c284-4767-ae58-05cc4a31448f'
const EMAIL_WEBHOOK = 'https://flow.a.gentic.dev/webhook/cloe-email-receiver-webhook'

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with { execution_time: "ISO 8601 timestamp" }' },
    { status: 405 }
  )
}

function calculateNextRun(scheduleConfig: any): string {
  const { timezone } = scheduleConfig
  const now = new Date()
  
  if (scheduleConfig.interval_hours) {
    const nextRun = new Date(now.getTime() + scheduleConfig.interval_hours * 60 * 60 * 1000)
    return nextRun.toISOString()
  }
  
  const { times, days } = scheduleConfig
  const todayDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }).toLowerCase()
  const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  const possibleRuns: Date[] = []
  
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const checkDate = new Date(now)
    checkDate.setDate(now.getDate() + dayOffset)
    const checkDay = daysOrder[(daysOrder.indexOf(todayDay) + dayOffset) % 7]
    
    if (days.includes(checkDay)) {
      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number)
        const candidateRun = new Date(checkDate)
        candidateRun.setHours(hours, minutes, 0, 0)
        
        if (candidateRun > now) {
          possibleRuns.push(candidateRun)
        }
      }
    }
  }
  
  if (possibleRuns.length > 0) {
    possibleRuns.sort((a, b) => a.getTime() - b.getTime())
    return possibleRuns[0].toISOString()
  }
  
  const nextRun = new Date(now)
  nextRun.setDate(now.getDate() + 7)
  const [hours, minutes] = times[0].split(':').map(Number)
  nextRun.setHours(hours, minutes, 0, 0)
  return nextRun.toISOString()
}

async function triggerProactiveAction(action: any): Promise<{ success: boolean; error?: string }> {
  console.log(`\n🚀 Triggering proactive action: ${action.id}`)
  
  try {
    const userData = await getSupabaseUser(action.user_id)
    if (!userData) {
      throw new Error(`User not found: ${action.user_id}`)
    }
    
    console.log(`   👤 User: ${userData.email || action.user_id}`)
    
    const deliveryChannel = action.delivery_channel
    let webhookUrl = SMS_WHATSAPP_WEBHOOK
    let payload: any = {}
    
    if (deliveryChannel === 'sms' || deliveryChannel === 'whatsapp') {
      const phoneNumber = userData.whatsapp_number
      if (!phoneNumber) {
        throw new Error('User has no phone number configured')
      }
      
      const formattedTo = deliveryChannel === 'whatsapp' 
        ? `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber}`
        : phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber
      
      payload = {
        MessageType: 'proactive_action',
        To: deliveryChannel === 'whatsapp' ? 'whatsapp:+14013605868' : '+14013605868',
        WaId: phoneNumber.replace(/\D/g, ''),
        Body: "My daily net calories so far?",
        channel: deliveryChannel,
        user_id: action.user_id,
        action_id: action.id,
        action_type: action.action_type,
        skill_names: action.skill_names,
        instruction_prompt: action.instruction_prompt,
        is_proactive: true
      }
    } else if (deliveryChannel === 'email') {
      webhookUrl = EMAIL_WEBHOOK
      const email = userData.email
      if (!email) {
        throw new Error('User has no email configured')
      }
      
      payload = {
        to: email,
        user_id: action.user_id,
        action_id: action.id,
        action_type: action.action_type,
        skill_names: action.skill_names,
        instruction_prompt: action.instruction_prompt,
        is_proactive: true
      }
    } else {
      throw new Error(`Unknown delivery channel: ${deliveryChannel}`)
    }
    
    console.log(`   📤 Calling webhook for ${deliveryChannel}...`)
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!webhookResponse.ok) {
      throw new Error(`Webhook returned ${webhookResponse.status}`)
    }
    
    console.log(`   ✅ Webhook triggered successfully`)
    
    const nextRunAt = calculateNextRun(action.schedule_config)
    const lastRunAt = new Date().toISOString()
    
    console.log(`   📅 Next run at: ${nextRunAt}`)
    
    await fetch(
      `${SUPABASE_URL}/rest/v1/proactive_actions?id=eq.${action.id}`,
      {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          next_run_at: nextRunAt,
          last_run_at: lastRunAt,
          success_count: (action.success_count || 0) + 1
        })
      }
    )
    
    return { success: true }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`   ❌ Failed: ${errorMessage}`)
    
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/proactive_actions?id=eq.${action.id}`,
        {
          method: 'PATCH',
          headers: { ...HEADERS, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            failure_count: (action.failure_count || 0) + 1,
            last_error: errorMessage
          })
        }
      )
    } catch (e) {}
    
    return { success: false, error: errorMessage }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { execution_time } = body

    if (!execution_time) {
      return NextResponse.json(
        { error: 'execution_time is required (ISO 8601 format)' },
        { status: 400 }
      )
    }

    const executionDate = new Date(execution_time)
    
    if (isNaN(executionDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid execution_time format' },
        { status: 400 }
      )
    }

    console.log(`\n🕐 Proactive Actions Check at: ${executionDate.toISOString()}`)
    console.log('='.repeat(60))

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/proactive_actions?is_active=eq.true&order=next_run_at.asc`,
      { method: 'GET', headers: HEADERS }
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
    
    if (!Array.isArray(actions) || actions.length === 0) {
      console.log('📭 No active proactive actions found')
      return NextResponse.json({
        success: true,
        message: 'No active proactive actions',
        executed: [],
        skipped: []
      })
    }

    console.log(`📋 Found ${actions.length} active action(s)\n`)

    const executed: any[] = []
    const skipped: any[] = []

    for (const action of actions) {
      const nextRunDate = new Date(action.next_run_at)
      const timeDifference = Math.abs(executionDate.getTime() - nextRunDate.getTime())
      
      const shouldRun = timeDifference <= 5 * 60 * 1000
      
      if (shouldRun) {
        const result = await triggerProactiveAction(action)
        executed.push({
          id: action.id,
          user_id: action.user_id,
          skill_names: action.skill_names,
          delivery_channel: action.delivery_channel,
          success: result.success,
          error: result.error
        })
      } else {
        skipped.push({
          id: action.id,
          scheduled_time: action.next_run_at,
          minutes_until_ready: Math.floor((nextRunDate.getTime() - executionDate.getTime()) / (1000 * 60))
        })
      }
    }

    console.log(`\n📊 Summary: ${executed.length} executed, ${skipped.length} skipped`)
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({
      success: true,
      execution_time: executionDate.toISOString(),
      executed,
      skipped
    })

  } catch (error) {
    console.error('Error in proactive actions execute:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
