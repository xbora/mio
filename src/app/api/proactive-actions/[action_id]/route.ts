import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ action_id: string }> }
) {
  try {
    const { action_id } = await params
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const workos_user_id = authHeader.replace('Bearer ', '')

    const existingResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/proactive_actions?id=eq.${action_id}&user_id=eq.${workos_user_id}`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!existingResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify action ownership' },
        { status: 500 }
      )
    }

    const existingActions = await existingResponse.json()
    if (existingActions.length === 0) {
      return NextResponse.json(
        { error: 'Proactive action not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { 
      is_active,
      instruction_prompt,
      next_run_at,
      delivery_channel,
      skill_names,
      action_type,
      schedule_config
    } = body

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return NextResponse.json(
          { error: 'is_active must be a boolean' },
          { status: 400 }
        )
      }
      updateData.is_active = is_active
    }

    if (instruction_prompt !== undefined) {
      if (typeof instruction_prompt !== 'string' || instruction_prompt.trim() === '') {
        return NextResponse.json(
          { error: 'instruction_prompt must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.instruction_prompt = instruction_prompt
    }

    if (next_run_at !== undefined) {
      const parsedDate = new Date(next_run_at)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'next_run_at must be a valid ISO 8601 date string' },
          { status: 400 }
        )
      }
      updateData.next_run_at = parsedDate.toISOString()
    }

    if (delivery_channel !== undefined) {
      const validChannels = ['email', 'sms', 'whatsapp']
      if (!validChannels.includes(delivery_channel)) {
        return NextResponse.json(
          { error: `delivery_channel must be one of: ${validChannels.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.delivery_channel = delivery_channel
    }

    if (skill_names !== undefined) {
      if (!Array.isArray(skill_names) || skill_names.length === 0) {
        return NextResponse.json(
          { error: 'skill_names must be a non-empty array' },
          { status: 400 }
        )
      }
      updateData.skill_names = skill_names
    }

    if (action_type !== undefined) {
      const validActionTypes = ['reminder', 'analysis', 'summary', 'insight']
      if (!validActionTypes.includes(action_type)) {
        return NextResponse.json(
          { error: `action_type must be one of: ${validActionTypes.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.action_type = action_type
    }

    if (schedule_config !== undefined) {
      const isIntervalSchedule = schedule_config.interval_hours !== undefined
      const isDailySchedule = schedule_config.times !== undefined || schedule_config.time !== undefined
      
      if (!schedule_config.timezone) {
        return NextResponse.json(
          { error: 'schedule_config must include timezone' },
          { status: 400 }
        )
      }

      if (isIntervalSchedule) {
        if (typeof schedule_config.interval_hours !== 'number' || schedule_config.interval_hours <= 0) {
          return NextResponse.json(
            { error: 'interval_hours must be a positive number' },
            { status: 400 }
          )
        }
      } else if (isDailySchedule) {
        if (schedule_config.time && !schedule_config.times) {
          schedule_config.times = [schedule_config.time]
          delete schedule_config.time
        }
        
        if (!Array.isArray(schedule_config.times) || schedule_config.times.length === 0) {
          return NextResponse.json(
            { error: 'times must be a non-empty array for daily schedules' },
            { status: 400 }
          )
        }
        
        if (!schedule_config.days || !Array.isArray(schedule_config.days) || schedule_config.days.length === 0) {
          return NextResponse.json(
            { error: 'days must be a non-empty array for daily schedules' },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'schedule_config must include either times/days or interval_hours' },
          { status: 400 }
        )
      }

      updateData.schedule_config = schedule_config
      
      if (next_run_at === undefined) {
        updateData.next_run_at = calculateNextRun(schedule_config)
      }
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: 'No valid fields provided for update. Allowed fields: is_active, instruction_prompt, next_run_at, delivery_channel, skill_names, action_type, schedule_config' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/proactive_actions?id=eq.${action_id}&user_id=eq.${workos_user_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to update proactive action:', errorText)
      return NextResponse.json(
        { error: 'Failed to update proactive action', details: errorText },
        { status: 500 }
      )
    }

    const updatedAction = await response.json()
    console.log('✅ Updated proactive action:', updatedAction)

    return NextResponse.json({
      success: true,
      message: 'Proactive action updated successfully',
      data: updatedAction[0]
    })

  } catch (error) {
    console.error('Error updating proactive action:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
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
