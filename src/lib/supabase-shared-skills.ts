import { SUPABASE_URL, HEADERS, SharedSkill } from './supabase'
import { randomUUID } from 'crypto'

/**
 * Create a shared skill invitation
 */
export async function createSharedSkillInvite(params: {
  skill_name: string
  owner_workos_user_id: string
  shared_with_workos_user_id: string
  owner_arca_folder: string
  shared_with_arca_folder: string
  arca_table_name: string
  skill_type: 'tabular' | 'vector'
}): Promise<SharedSkill> {
  const invite_token = randomUUID()

  const sharedSkillData = {
    ...params,
    status: 'pending',
    invite_token,
    invite_sent_at: new Date().toISOString()
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_skills`,
    {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(sharedSkillData)
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create shared skill invite: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return (Array.isArray(data) ? data[0] : data) as SharedSkill
}

/**
 * Get a shared skill by invite token
 */
export async function getSharedSkillByToken(token: string): Promise<SharedSkill | null> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_skills?invite_token=eq.${token}`,
    {
      method: 'GET',
      headers: HEADERS
    }
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return Array.isArray(data) && data.length > 0 ? data[0] as SharedSkill : null
}

/**
 * Check if a skill share already exists
 */
export async function checkSharedSkillExists(
  owner_workos_user_id: string,
  shared_with_workos_user_id: string,
  skill_name: string
): Promise<SharedSkill | null> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_skills?owner_workos_user_id=eq.${owner_workos_user_id}&shared_with_workos_user_id=eq.${shared_with_workos_user_id}&skill_name=eq.${skill_name}&status=eq.accepted`,
    {
      method: 'GET',
      headers: HEADERS
    }
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return Array.isArray(data) && data.length > 0 ? data[0] as SharedSkill : null
}

/**
 * Log a shared skill sync operation
 */
export async function logSharedSkillSync(params: {
  shared_skill_id: string
  action: string
  performed_by_workos_user_id: string
  synced_to_workos_user_id: string
  arca_operation: string
  success: boolean
  error_message: string | null
}): Promise<void> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_skill_sync_log`,
    {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(params)
    }
  )

  if (!response.ok) {
    console.error('Failed to log sync operation:', await response.text())
  }
}