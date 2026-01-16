
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      workos_user_id,  // Accept workos_user_id from request
      skill_names,
      action_type, 
      schedule_config, 
      delivery_channel, 
      instruction_prompt,
      user_timezone  // Optional: user's timezone, takes priority over schedule_config.timezone
    } = body
    
    // user_timezone takes priority over schedule_config.timezone
    if (user_timezone) {
      schedule_config.timezone = user_timezone
    }

    // Validate workos_user_id is provided
    if (!workos_user_id) {
      return NextResponse.json(
        { error: 'workos_user_id is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!skill_names || !action_type || !schedule_config || !delivery_channel || !instruction_prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: skill_names, action_type, schedule_config, delivery_channel, instruction_prompt' },
        { status: 400 }
      )
    }

    // Validate skill_names is an array with at least one skill
    if (!Array.isArray(skill_names) || skill_names.length === 0) {
      return NextResponse.json(
        { error: 'skill_names must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate schedule_config structure
    // Support two formats:
    // 1. Daily schedule: {times: ["09:00", "18:00"], timezone, days}
    // 2. Interval schedule: {interval_hours: 3, timezone}
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
      // Normalize single time to array
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

    // Calculate next_run_at based on schedule
    const nextRunAt = calculateNextRun(schedule_config)

    // Create the proactive action in Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/proactive_actions`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: workos_user_id,
          skill_names,  // Array of skills
          action_type,
          schedule_config,
          delivery_channel,
          instruction_prompt,
          is_active: true,
          next_run_at: nextRunAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create proactive action:', errorText)
      return NextResponse.json(
        { error: 'Failed to create proactive action', details: errorText },
        { status: 500 }
      )
    }

    const createdAction = await response.json()
    console.log('✅ Created proactive action:', createdAction)

    return NextResponse.json({
      success: true,
      message: 'Proactive action created successfully',
      data: createdAction[0]
    })

  } catch (error) {
    console.error('Error creating proactive action:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to convert a local time in a given timezone to UTC Date
function localTimeToUTC(dateInUTC: Date, hours: number, minutes: number, timezone: string): Date {
  // Get the date in the user's timezone
  const year = parseInt(dateInUTC.toLocaleDateString('en-US', { year: 'numeric', timeZone: timezone }))
  const month = parseInt(dateInUTC.toLocaleDateString('en-US', { month: 'numeric', timeZone: timezone })) - 1
  const day = parseInt(dateInUTC.toLocaleDateString('en-US', { day: 'numeric', timeZone: timezone }))
  
  // Create an ISO string representing the local time in that timezone
  const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
  
  // Use Intl.DateTimeFormat to get the timezone offset for this specific date/time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Create a date in UTC that represents the target local time
  // We need to find what UTC time corresponds to this local time
  const tempDate = new Date(`${localDateStr}Z`) // Parse as UTC first
  const localTime = new Date(tempDate.toLocaleString('en-US', { timeZone: timezone }))
  const utcTime = new Date(tempDate.toLocaleString('en-US', { timeZone: 'UTC' }))
  // offset = how much to add to local time to get UTC (e.g., +5 hours for EST)
  const offset = utcTime.getTime() - localTime.getTime()
  
  // Adjust by the offset to get the correct UTC time
  return new Date(tempDate.getTime() + offset)
}

// Helper function to calculate next run time
function calculateNextRun(scheduleConfig: any): string {
  const { timezone } = scheduleConfig
  const now = new Date()
  
  // Handle interval-based scheduling (e.g., every 3 hours)
  if (scheduleConfig.interval_hours) {
    const nextRun = new Date(now.getTime() + scheduleConfig.interval_hours * 60 * 60 * 1000)
    return nextRun.toISOString()
  }
  
  // Handle daily scheduling with multiple times
  const { times, days } = scheduleConfig
  const todayDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }).toLowerCase()
  const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  // Find all possible next run times within the next 7 days
  const possibleRuns: Date[] = []
  
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    // Get the date that is dayOffset days from now in the user's timezone
    const checkDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const checkDay = checkDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }).toLowerCase()
    
    if (days.includes(checkDay)) {
      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number)
        // Convert the local time to UTC
        const candidateRun = localTimeToUTC(checkDate, hours, minutes, timezone)
        
        // Only consider future times
        if (candidateRun > now) {
          possibleRuns.push(candidateRun)
        }
      }
    }
  }
  
  // Return the earliest future run time
  if (possibleRuns.length > 0) {
    possibleRuns.sort((a, b) => a.getTime() - b.getTime())
    return possibleRuns[0].toISOString()
  }
  
  // Fallback: schedule for the first time on the first scheduled day next week
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const [hours, minutes] = times[0].split(':').map(Number)
  const nextRun = localTimeToUTC(nextWeek, hours, minutes, timezone)
  return nextRun.toISOString()
}
