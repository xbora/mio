import { NextRequest, NextResponse } from 'next/server'
import { logSharedSkillSync } from '@/lib/supabase-shared-skills'

/**
 * POST /api/skills/sync
 * Sync a shared skill from owner to recipient
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shared_skill_id, direction = 'owner_to_recipient' } = body

    if (!shared_skill_id) {
      return NextResponse.json(
        { error: 'shared_skill_id is required' },
        { status: 400 }
      )
    }

    if (!['owner_to_recipient', 'recipient_to_owner'].includes(direction)) {
      return NextResponse.json(
        { error: 'direction must be either "owner_to_recipient" or "recipient_to_owner"' },
        { status: 400 }
      )
    }

    // Get the shared skill record
    const sharedSkillResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/shared_skills?id=eq.${shared_skill_id}`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!sharedSkillResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch shared skill' },
        { status: 500 }
      )
    }

    const sharedSkillData = await sharedSkillResponse.json()

    if (!Array.isArray(sharedSkillData) || sharedSkillData.length === 0) {
      return NextResponse.json(
        { error: 'Shared skill not found' },
        { status: 404 }
      )
    }

    const sharedSkill = sharedSkillData[0]

    // Only sync accepted shares
    if (sharedSkill.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Shared skill must be accepted before syncing' },
        { status: 400 }
      )
    }

    // Determine source and destination based on direction
    const isReverseSync = direction === 'recipient_to_owner'
    const sourceUserId = isReverseSync ? sharedSkill.shared_with_workos_user_id : sharedSkill.owner_workos_user_id
    const destinationUserId = isReverseSync ? sharedSkill.owner_workos_user_id : sharedSkill.shared_with_workos_user_id

    console.log(`🔄 Starting ${direction} sync for shared skill:`, {
      id: sharedSkill.id,
      skill_name: sharedSkill.skill_name,
      direction,
      source: isReverseSync ? sharedSkill.shared_with_arca_folder : sharedSkill.owner_arca_folder,
      destination: isReverseSync ? sharedSkill.owner_arca_folder : sharedSkill.shared_with_arca_folder
    })

    // Step 1: Get source user record (owner or recipient depending on direction)
    const sourceUserResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${sourceUserId}`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!sourceUserResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch source user data' },
        { status: 500 }
      )
    }

    const sourceUserData = await sourceUserResponse.json()
    if (!Array.isArray(sourceUserData) || sourceUserData.length === 0) {
      return NextResponse.json(
        { error: 'Source user not found' },
        { status: 404 }
      )
    }

    const sourceUser = sourceUserData[0]
    const sourceMioApiKey = sourceUser.workos_user_id

    console.log('📍 Source details:', {
      sourceMioApiKey,
      skill: sharedSkill.arca_table_name,
      mcp_server_url: process.env.MCP_SERVER_URL
    })

    // Step 2a: First, list the source's skills to verify the skill exists
    console.log('📋 Listing source skills to verify skill exists...')

    const { experimental_createMCPClient } = await import('@ai-sdk/mcp')

    const sourceMcpClient = await experimental_createMCPClient({
      transport: {
        type: 'http',
        url: process.env.MCP_SERVER_URL || 'https://m.mio.fyi/',
        headers: {
          Authorization: `Bearer ${sourceMioApiKey}`
        }
      }
    })

    // Declare sourceData outside try-catch so it's accessible later
    let sourceData: any = null

    try {
      const tools = await sourceMcpClient.tools()
      console.log('📋 Source MCP tools loaded:', Object.keys(tools))

      // Call list_skills tool
      const listSkillsResult = await tools.list_skills.execute({}, { toolCallId: 'list-skills', messages: [] }) as any
      console.log('📋 Owner skills raw result:', JSON.stringify(listSkillsResult, null, 2))

      // Parse the MCP tool response - it returns content array with structured data
      let skillsData: any = null
      if (listSkillsResult.content && Array.isArray(listSkillsResult.content)) {
        const textContent = listSkillsResult.content.find((c: any) => c.type === 'text')
        if (textContent && textContent.text) {
          skillsData = JSON.parse(textContent.text)
        }
      } else if (listSkillsResult.structuredContent) {
        // Also check structuredContent if available
        skillsData = listSkillsResult.structuredContent
      }

      console.log('📋 Parsed skills data:', JSON.stringify(skillsData, null, 2))

      if (!skillsData || !skillsData.my_skills) {
        console.error('❌ Could not parse skills data from MCP response')
        return NextResponse.json(
          { error: 'Failed to parse skills list from MCP server' },
          { status: 500 }
        )
      }

      // Check if the skill exists in the list
      const skillExists = skillsData.my_skills.some(
        (skill: any) => skill.name === sharedSkill.arca_table_name
      )
      console.log(`📋 Skill "${sharedSkill.arca_table_name}" exists:`, skillExists)

      if (!skillExists) {
        console.error(`❌ Skill "${sharedSkill.arca_table_name}" not found in owner's skills list`)
        return NextResponse.json(
          { 
            error: `Skill "${sharedSkill.arca_table_name}" not found in owner's Arca account`,
            available_skills: skillsData.my_skills.map((s: any) => s.name)
          },
          { status: 404 }
        )
      }

      console.log(`✅ Verified skill "${sharedSkill.arca_table_name}" exists in source account`)

      // Step 2b: Read data from source's skill
      // We'll read all data initially, but only sync the most recent record
      console.log('📖 Reading data from source skill...')

      const getItemsResult = await tools.get_tabular_items.execute({
        skill: sharedSkill.arca_table_name
      }, { toolCallId: 'get-items', messages: [] }) as any

      console.log('📦 Source data raw result:', JSON.stringify(getItemsResult, null, 2))

      // Parse the MCP tool response
      if (getItemsResult.content && Array.isArray(getItemsResult.content)) {
        const textContent = getItemsResult.content.find((c: any) => c.type === 'text')
        if (textContent && textContent.text) {
          sourceData = JSON.parse(textContent.text)
        }
      } else if (getItemsResult.structuredContent) {
        sourceData = getItemsResult.structuredContent
      }

      console.log('📦 Parsed source data:', JSON.stringify(sourceData, null, 2))

      if (!sourceData || !sourceData.success) {
        console.error('❌ Failed to read data from source skill')

        await logSharedSkillSync({
          shared_skill_id: sharedSkill.id,
          action: 'sync',
          performed_by_workos_user_id: sourceUserId,
          synced_to_workos_user_id: destinationUserId,
          arca_operation: JSON.stringify({ step: 'read_source', error: 'Failed to parse response', direction }),
          success: false,
          error_message: 'Failed to read from source Arca'
        })

        return NextResponse.json(
          { error: 'Failed to read data from source Arca account' },
          { status: 500 }
        )
      }

      if (!sourceData.data || sourceData.data.length === 0) {
        console.log('⚠️ No data found in source skill')

        await logSharedSkillSync({
          shared_skill_id: sharedSkill.id,
          action: 'sync',
          performed_by_workos_user_id: sourceUserId,
          synced_to_workos_user_id: destinationUserId,
          arca_operation: JSON.stringify({ step: 'read_source', result: 'no_data', direction }),
          success: true,
          error_message: null
        })

        return NextResponse.json({
          success: true,
          message: 'No data to sync yet',
          records_synced: 0
        })
      }

      console.log(`📖 Read ${sourceData.data.length} total records from source`)

      // Close the MCP client now that we're done reading
      await sourceMcpClient.close()
    } catch (error: any) {
      console.error('❌ Failed to read source data:', error.message)
      console.error('❌ Full error:', error)

      // Make sure to close the MCP client
      try {
        await sourceMcpClient.close()
      } catch (closeError) {
        console.error('Error closing MCP client:', closeError)
      }

      return NextResponse.json(
        { error: 'Failed to read source skills', details: error.message },
        { status: 500 }
      )
    }

    // Step 3: Get destination's Mio WorkOS user ID and initialize MCP client
    const destinationUserResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?workos_user_id=eq.${destinationUserId}`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!destinationUserResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch destination user data' },
        { status: 500 }
      )
    }

    const destinationUserData = await destinationUserResponse.json()
    if (!Array.isArray(destinationUserData) || destinationUserData.length === 0) {
      return NextResponse.json(
        { error: 'Destination user not found' },
        { status: 404 }
      )
    }

    const destinationUser = destinationUserData[0]
    const destinationMioApiKey = destinationUser.workos_user_id
    
    // Get the Arca API key from the shared_skills table
    const destinationArcaApiKey = isReverseSync ? sharedSkill.owner_arca_folder : sharedSkill.shared_with_arca_folder

    console.log('📍 Destination details:', {
      destinationMioApiKey,
      destinationArcaApiKey,
      skill: sharedSkill.arca_table_name
    })

    // Initialize MCP client for destination
    const destinationMcpClient = await experimental_createMCPClient({
      transport: {
        type: 'http',
        url: process.env.MCP_SERVER_URL || 'https://m.mio.fyi/',
        headers: {
          Authorization: `Bearer ${destinationMioApiKey}`
        }
      }
    })

    let syncedCount = 0
    const syncErrors = []
    let recordsToSync: any[] = []
    let updateOperations: Array<{ sourceRecord: any; destinationRecord: any }> = []

    // Helper function to call Arca API directly (bypass MCP to prevent circular webhooks)
    const callArcaApi = async (endpoint: string, data: any) => {
      const response = await fetch(`https://arca.build/api/v1${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${destinationArcaApiKey}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Arca API error: ${response.status} - ${errorText}`)
      }

      return await response.json()
    }

    try {
      const destinationTools = await destinationMcpClient.tools()
      console.log('📋 Destination MCP tools loaded:', Object.keys(destinationTools))

      // Step 4: Check if destination skill exists
      const destinationListResult = await destinationTools.list_skills.execute({}, { toolCallId: 'dest-list-skills', messages: [] }) as any
      let destinationSkillsData: any = null

      if (destinationListResult.content && Array.isArray(destinationListResult.content)) {
        const textContent = destinationListResult.content.find((c: any) => c.type === 'text')
        if (textContent && textContent.text) {
          destinationSkillsData = JSON.parse(textContent.text)
        }
      } else if (destinationListResult.structuredContent) {
        destinationSkillsData = destinationListResult.structuredContent
      }

      const destinationSkillExists = destinationSkillsData?.my_skills?.some(
        (skill: any) => skill.name === sharedSkill.arca_table_name
      ) || false

      console.log(`📋 Destination skill "${sharedSkill.arca_table_name}" exists:`, destinationSkillExists)

      // Determine which records to sync

      if (!destinationSkillExists) {
        // First time sync - sync all records
        console.log('🆕 First sync - will sync all records to create the skill')
        recordsToSync = sourceData.data
      } else {
        // Subsequent sync - simple ID-based update logic
        console.log('🔄 Incremental sync - finding most recent record to sync')

        // Sort records by updated_at descending to get the most recently changed
        const sortedRecords = [...sourceData.data].sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime()
          const dateB = new Date(b.updated_at || b.created_at).getTime()
          return dateB - dateA
        })

        const mostRecentRecord = sortedRecords[0]
        const mostRecentTimestamp = mostRecentRecord.updated_at || mostRecentRecord.created_at
        console.log(`📌 Most recent record:`, {
          id: mostRecentRecord.id,
          updated_at: mostRecentTimestamp
        })

        // Get destination's current data
        const destinationGetItemsResult = await destinationTools.get_tabular_items.execute({
          skill: sharedSkill.arca_table_name
        }, { toolCallId: 'dest-get-items', messages: [] }) as any

        let destinationData: any = null
        if (destinationGetItemsResult.content && Array.isArray(destinationGetItemsResult.content)) {
          const textContent = destinationGetItemsResult.content.find((c: any) => c.type === 'text')
          if (textContent && textContent.text) {
            destinationData = JSON.parse(textContent.text)
          }
        } else if (destinationGetItemsResult.structuredContent) {
          destinationData = destinationGetItemsResult.structuredContent
        }

        if (destinationData && destinationData.data) {
          // Find the record with the same ID in destination
          const matchingDestRecord = destinationData.data.find(
            (r: any) => r.id === mostRecentRecord.id
          )

          if (matchingDestRecord) {
            // Found matching ID - update it
            console.log(`🔄 Found matching record with id=${mostRecentRecord.id} - will update`)
            updateOperations.push({
              sourceRecord: mostRecentRecord,
              destinationRecord: matchingDestRecord
            })
          } else {
            // No matching ID - this is a new record
            console.log(`🆕 No matching record with id=${mostRecentRecord.id} - will insert`)
            recordsToSync = [mostRecentRecord]
          }
        } else {
          // Couldn't read destination data, sync the recent record to be safe
          console.log('⚠️ Could not read destination data, syncing most recent record')
          recordsToSync = [mostRecentRecord]
        }
      }

      // Step 5a: Handle update operations using Arca API directly (prevents circular webhook triggers)
      for (const { sourceRecord, destinationRecord } of updateOperations) {
        const { id: _id, created_at: _created, updated_at: _updated, ...sourceData } = sourceRecord

        try {
          console.log(`📝 Updating record with id=${destinationRecord.id} via Arca API...`)

          const updateResult = await callArcaApi('/tables/update', {
            tableName: sharedSkill.arca_table_name,
            where: { id: destinationRecord.id },
            data: sourceData
          })

          console.log('📝 Arca API update result:', JSON.stringify(updateResult, null, 2))
          
          if (updateResult.success) {
            syncedCount++
            console.log(`✅ Updated record ${syncedCount} via Arca API`)
          } else {
            throw new Error(updateResult.error || 'Update failed')
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          syncErrors.push({ record: sourceData, error: errorMsg, operation: 'update' })
          console.error('❌ Error updating record:', errorMsg)
        }
      }

      // Step 5b: Handle new record additions using Arca API directly (prevents circular webhook triggers)
      for (let i = 0; i < recordsToSync.length; i++) {
        const record = recordsToSync[i]
        // Remove system fields that shouldn't be copied
        const { id, created_at, updated_at, ...recordData } = record

        try {
          if (!destinationSkillExists && i === 0) {
            // Create the skill with the first record using Arca API
            console.log('📝 Creating destination skill with first record via Arca API...')

            // Infer column types from the first record
            const columns = Object.entries(recordData).map(([key, value]) => {
              let colType = 'VARCHAR'
              if (typeof value === 'number') {
                colType = Number.isInteger(value) ? 'INTEGER' : 'DOUBLE'
              } else if (typeof value === 'boolean') {
                colType = 'BOOLEAN'
              } else if (value instanceof Date) {
                colType = 'TIMESTAMP'
              }
              return { name: key, type: colType }
            })

            const createResult = await callArcaApi('/tables/upsert', {
              tableName: sharedSkill.arca_table_name,
              columns: columns,
              data: recordData,
              skill: {
                description: `Shared from ${isReverseSync ? sharedSkill.shared_with_arca_folder : sharedSkill.owner_arca_folder}`,
                examples: [],
                relationships: [],
                notes: 'This is a shared skill. Data syncs bidirectionally.'
              }
            })

            console.log('📝 Arca API create result:', JSON.stringify(createResult, null, 2))
            
            if (createResult.success) {
              syncedCount++
              console.log(`✅ Created skill and synced record 1/${recordsToSync.length} via Arca API`)
            } else {
              throw new Error(createResult.error || 'Create failed')
            }
          } else {
            // Add the record to existing skill using Arca API
            console.log(`📝 Adding record ${i + 1}/${recordsToSync.length} via Arca API...`)
            
            const addResult = await callArcaApi('/tables/upsert', {
              tableName: sharedSkill.arca_table_name,
              data: recordData
            })

            console.log('📝 Arca API upsert result:', JSON.stringify(addResult, null, 2))
            
            if (addResult.success) {
              syncedCount++
              console.log(`✅ Synced record ${syncedCount}/${recordsToSync.length} via Arca API`)
            } else {
              throw new Error(addResult.error || 'Upsert failed')
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          syncErrors.push({ record: recordData, error: errorMsg, operation: 'add' })
          console.error('❌ Error syncing record:', errorMsg)
        }
      }

      // Close the destination MCP client
      await destinationMcpClient.close()
    } catch (error: any) {
      console.error('❌ Failed to sync to destination:', error.message)
      console.error('❌ Full error:', error)

      // Make sure to close the MCP client
      try {
        await destinationMcpClient.close()
      } catch (closeError) {
        console.error('Error closing destination MCP client:', closeError)
      }

      return NextResponse.json(
        { error: 'Failed to sync to destination', details: error.message },
        { status: 500 }
      )
    }

    // Log the sync operation
    const success = syncErrors.length === 0
    const totalOperations = updateOperations.length + recordsToSync.length

    await logSharedSkillSync({
      shared_skill_id: sharedSkill.id,
      action: 'sync',
      performed_by_workos_user_id: sourceUserId,
      synced_to_workos_user_id: destinationUserId,
      arca_operation: JSON.stringify({
        direction,
        records_read: sourceData.data.length,
        records_updated: updateOperations.length,
        records_added: recordsToSync.length,
        records_synced: syncedCount,
        errors: syncErrors
      }),
      success,
      error_message: syncErrors.length > 0 ? `${syncErrors.length} operations failed` : null
    })

    console.log(`✅ Sync complete: ${updateOperations.length} updated, ${recordsToSync.length} added`)

    return NextResponse.json({
      success,
      message: success 
        ? totalOperations > 0 
          ? `Successfully synced ${syncedCount} operation(s) (${updateOperations.length} updated, ${recordsToSync.length} added)`
          : 'No changes to sync'
        : `Synced ${syncedCount} records with ${syncErrors.length} errors`,
      records_updated: updateOperations.length,
      records_added: recordsToSync.length,
      records_synced: syncedCount,
      errors: syncErrors.length > 0 ? syncErrors : undefined
    })

  } catch (error) {
    console.error('Error syncing shared skill:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}