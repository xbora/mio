
import { NextRequest, NextResponse } from 'next/server'
import { logSharedSkillSync } from '@/lib/supabase-shared-skills'

/**
 * POST /api/skills/sync-vector
 * Sync a shared vector skill from owner to recipient using timestamp-based approach
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
    const destinationArcaApiKey = isReverseSync ? sharedSkill.owner_arca_folder : sharedSkill.shared_with_arca_folder

    console.log(`🔄 Starting ${direction} vector sync for shared skill:`, {
      id: sharedSkill.id,
      skill_name: sharedSkill.skill_name,
      direction,
      source: isReverseSync ? sharedSkill.shared_with_arca_folder : sharedSkill.owner_arca_folder,
      destination: destinationArcaApiKey
    })

    // Step 1: Search source's vector skill to get the most recent entry
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
    const sourceArcaApiKey = isReverseSync ? sharedSkill.shared_with_arca_folder : sharedSkill.owner_arca_folder

    console.log('📍 Source details:', {
      sourceArcaApiKey,
      skill: sharedSkill.arca_table_name
    })

    // Step 2: Search source's vector skill for most recent entry
    // Get multiple entries to filter out "seed" records
    const searchResponse = await fetch('https://arca.build/api/v1/vectors/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sourceArcaApiKey}`
      },
      body: JSON.stringify({
        tableName: sharedSkill.arca_table_name,
        query: 'all entries data',
        limit: 10
      })
    })

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('❌ Failed to search source vector skill:', errorText)
      
      await logSharedSkillSync({
        shared_skill_id: sharedSkill.id,
        action: 'sync',
        performed_by_workos_user_id: sourceUserId,
        synced_to_workos_user_id: destinationUserId,
        arca_operation: JSON.stringify({ step: 'search_source', error: errorText, direction }),
        success: false,
        error_message: 'Failed to search source vector skill'
      })

      return NextResponse.json(
        { error: 'Failed to search source vector skill', details: errorText },
        { status: 500 }
      )
    }

    const searchResult = await searchResponse.json()
    console.log('📦 Source search result:', JSON.stringify(searchResult, null, 2))

    if (!searchResult.success || !searchResult.results || searchResult.results.length === 0) {
      console.log('⚠️ No data found in source vector skill')

      await logSharedSkillSync({
        shared_skill_id: sharedSkill.id,
        action: 'sync',
        performed_by_workos_user_id: sourceUserId,
        synced_to_workos_user_id: destinationUserId,
        arca_operation: JSON.stringify({ step: 'search_source', result: 'no_data', direction }),
        success: true,
        error_message: null
      })

      return NextResponse.json({
        success: true,
        message: 'No data to sync yet',
        records_synced: 0
      })
    }

    // Filter out "seed" records and sort by created_at to get most recent real entry
    const realEntries = searchResult.results.filter((entry: any) => 
      entry.text && entry.text.trim().toLowerCase() !== 'seed'
    )

    if (realEntries.length === 0) {
      console.log('⚠️ Only seed records found, no real data to sync')

      await logSharedSkillSync({
        shared_skill_id: sharedSkill.id,
        action: 'sync',
        performed_by_workos_user_id: sourceUserId,
        synced_to_workos_user_id: destinationUserId,
        arca_operation: JSON.stringify({ step: 'search_source', result: 'only_seed_records', direction }),
        success: true,
        error_message: null
      })

      return NextResponse.json({
        success: true,
        message: 'No real data to sync yet (only seed records)',
        records_synced: 0
      })
    }

    // Sort by created_at descending to get the most recent
    realEntries.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    // Get the most recent real entry
    const mostRecentEntry = realEntries[0]
    const mostRecentTimestamp = mostRecentEntry.created_at

    console.log(`📌 Most recent entry:`, {
      created_at: mostRecentTimestamp,
      text_preview: mostRecentEntry.text?.substring(0, 50) + '...'
    })

    // Step 3: Check if this entry already exists in destination
    const destinationSearchResponse = await fetch('https://arca.build/api/v1/vectors/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${destinationArcaApiKey}`
      },
      body: JSON.stringify({
        tableName: sharedSkill.arca_table_name,
        query: mostRecentEntry.text.substring(0, 100), // Use a portion of the text for similarity search
        limit: 10
      })
    })

    let shouldSync = true
    if (destinationSearchResponse.ok) {
      const destinationSearchResult = await destinationSearchResponse.json()
      
      if (destinationSearchResult.success && destinationSearchResult.results && destinationSearchResult.results.length > 0) {
        // Filter out seed records from destination too
        const destinationRealEntries = destinationSearchResult.results.filter((entry: any) => 
          entry.text && entry.text.trim().toLowerCase() !== 'seed'
        )
        
        if (destinationRealEntries.length > 0) {
          // Sort by created_at descending
          destinationRealEntries.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return dateB - dateA
          })
          
          const destinationMostRecent = destinationRealEntries[0]
          const destinationTimestamp = destinationMostRecent.created_at
          
          // Only sync if source is newer
          if (new Date(mostRecentTimestamp) <= new Date(destinationTimestamp)) {
            shouldSync = false
            console.log('⏭️ Destination already has the most recent entry, skipping sync')
          }
        }
      }
    }

    // Step 4: Determine if this is first-time sync or incremental update
    // For first-time sync (destination has no real entries), sync all real entries
    // For incremental sync, only sync the most recent if it's newer
    
    const isFirstTimeSync = destinationSearchResponse.ok ? 
      (await (async () => {
        const destResult = await destinationSearchResponse.json()
        if (!destResult.success || !destResult.results || destResult.results.length === 0) {
          return true
        }
        const destRealEntries = destResult.results.filter((e: any) => 
          e.text && e.text.trim().toLowerCase() !== 'seed'
        )
        return destRealEntries.length === 0
      })()) : true

    console.log(`📊 Sync type: ${isFirstTimeSync ? 'FIRST TIME (sync all)' : 'INCREMENTAL (sync newest)'}`)

    if (!isFirstTimeSync && !shouldSync) {
      await logSharedSkillSync({
        shared_skill_id: sharedSkill.id,
        action: 'sync',
        performed_by_workos_user_id: sourceUserId,
        synced_to_workos_user_id: destinationUserId,
        arca_operation: JSON.stringify({ step: 'check_timestamp', result: 'already_synced', direction }),
        success: true,
        error_message: null
      })

      return NextResponse.json({
        success: true,
        message: 'Destination already up to date',
        records_synced: 0
      })
    }

    // Step 5: Sync entries to destination
    const entriesToSync = isFirstTimeSync ? realEntries : [mostRecentEntry]
    let syncedCount = 0
    const syncErrors: any[] = []

    console.log(`📤 Syncing ${entriesToSync.length} entries to destination...`)

    for (let i = 0; i < entriesToSync.length; i++) {
      const entry = entriesToSync[i]
      
      try {
        const { text, category, subcategory, tags, location, people, context, ...otherMetadata } = entry

        const addResponse = await fetch('https://arca.build/api/v1/vectors/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${destinationArcaApiKey}`
          },
          body: JSON.stringify({
            tableName: sharedSkill.arca_table_name,
            text: text,
            metadata: {
              category: category || 'general',
              subcategory: subcategory || '',
              tags: tags || '',
              location: location || '',
              people: people || '',
              context: context || ''
            }
          })
        })

        if (!addResponse.ok) {
          const errorText = await addResponse.text()
          throw new Error(`Arca API error: ${addResponse.status} - ${errorText}`)
        }

        const addResult = await addResponse.json()
        syncedCount++
        console.log(`✅ Synced entry ${syncedCount}/${entriesToSync.length}:`, {
          created_at: entry.created_at,
          text_preview: text?.substring(0, 50) + '...'
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Error syncing entry ${i + 1}:`, errorMsg)
        syncErrors.push({ entry, error: errorMsg })
      }
    }

    await logSharedSkillSync({
      shared_skill_id: sharedSkill.id,
      action: 'sync',
      performed_by_workos_user_id: sourceUserId,
      synced_to_workos_user_id: destinationUserId,
      arca_operation: JSON.stringify({
        direction,
        sync_type: isFirstTimeSync ? 'first_time' : 'incremental',
        entries_synced: syncedCount,
        total_entries: entriesToSync.length,
        errors: syncErrors.length
      }),
      success: syncErrors.length === 0,
      error_message: syncErrors.length > 0 ? JSON.stringify(syncErrors) : null
    })

    if (syncErrors.length > 0 && syncedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to sync any entries', details: syncErrors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: isFirstTimeSync 
        ? `Successfully synced all ${syncedCount} vector entries` 
        : 'Successfully synced most recent vector entry',
      records_synced: syncedCount,
      sync_type: isFirstTimeSync ? 'first_time' : 'incremental',
      errors: syncErrors.length > 0 ? syncErrors : undefined
    })

  } catch (error) {
    console.error('Error syncing vector skill:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
