import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from './route'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

function createRequest(body: object, actionId: string, authHeader?: string): [NextRequest, { params: Promise<{ action_id: string }> }] {
  const req = new NextRequest('http://localhost/api/proactive-actions/' + actionId, {
    method: 'PATCH',
    headers: authHeader ? { 'Authorization': authHeader } : {},
    body: JSON.stringify(body),
  })
  return [req, { params: Promise.resolve({ action_id: actionId }) }]
}

describe('PATCH /api/proactive-actions/[action_id]', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns 401 when Authorization header is missing', async () => {
    const [req, context] = createRequest({ is_active: false }, 'test-id')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('returns 401 when Authorization header is invalid format', async () => {
    const [req, context] = createRequest({ is_active: false }, 'test-id', 'InvalidFormat token')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Missing or invalid Authorization header')
  })

  it('returns 404 when action does not exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    const [req, context] = createRequest({ is_active: false }, 'non-existent-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBe('Proactive action not found or you do not have permission to edit it')
  })

  it('returns 400 when is_active is not a boolean', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ is_active: 'not-a-boolean' }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('is_active must be a boolean')
  })

  it('returns 400 when instruction_prompt is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ instruction_prompt: '   ' }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('instruction_prompt must be a non-empty string')
  })

  it('returns 400 when delivery_channel is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ delivery_channel: 'telegram' }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('delivery_channel must be one of: email, sms, whatsapp')
  })

  it('returns 400 when action_type is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ action_type: 'notification' }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('action_type must be one of: reminder, analysis, summary, insight')
  })

  it('returns 400 when skill_names is empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ skill_names: [] }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('skill_names must be a non-empty array')
  })

  it('returns 400 when schedule_config is missing timezone', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ 
      schedule_config: { times: ['09:00'], days: ['monday'] } 
    }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('schedule_config must include timezone')
  })

  it('returns 400 when no valid fields provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({}, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toContain('No valid fields provided for update')
  })

  it('successfully updates is_active to false', async () => {
    const updatedAction = { 
      id: 'test-id', 
      user_id: 'user_123', 
      is_active: false,
      updated_at: '2024-01-15T10:00:00Z'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'test-id', user_id: 'user_123' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedAction],
      })

    const [req, context] = createRequest({ is_active: false }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Proactive action updated successfully')
    expect(data.data.is_active).toBe(false)
  })

  it('successfully updates multiple fields at once', async () => {
    const updatedAction = { 
      id: 'test-id', 
      user_id: 'user_123', 
      is_active: true,
      instruction_prompt: 'New instructions',
      delivery_channel: 'sms',
      updated_at: '2024-01-15T10:00:00Z'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'test-id', user_id: 'user_123' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedAction],
      })

    const [req, context] = createRequest({ 
      is_active: true,
      instruction_prompt: 'New instructions',
      delivery_channel: 'sms'
    }, 'test-id', 'Bearer user_123')
    
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.instruction_prompt).toBe('New instructions')
    expect(data.data.delivery_channel).toBe('sms')
  })

  it('successfully updates schedule_config with interval schedule', async () => {
    const updatedAction = { 
      id: 'test-id', 
      user_id: 'user_123',
      schedule_config: { interval_hours: 4, timezone: 'America/New_York' },
      updated_at: '2024-01-15T10:00:00Z'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'test-id', user_id: 'user_123' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedAction],
      })

    const [req, context] = createRequest({ 
      schedule_config: { interval_hours: 4, timezone: 'America/New_York' }
    }, 'test-id', 'Bearer user_123')
    
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.schedule_config.interval_hours).toBe(4)
  })

  it('successfully updates schedule_config with daily schedule', async () => {
    const updatedAction = { 
      id: 'test-id', 
      user_id: 'user_123',
      schedule_config: { 
        times: ['09:00', '17:00'], 
        days: ['monday', 'wednesday', 'friday'],
        timezone: 'America/Los_Angeles' 
      },
      updated_at: '2024-01-15T10:00:00Z'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'test-id', user_id: 'user_123' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedAction],
      })

    const [req, context] = createRequest({ 
      schedule_config: { 
        times: ['09:00', '17:00'], 
        days: ['monday', 'wednesday', 'friday'],
        timezone: 'America/Los_Angeles' 
      }
    }, 'test-id', 'Bearer user_123')
    
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.schedule_config.times).toEqual(['09:00', '17:00'])
  })

  it('returns 400 when next_run_at is invalid date format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'test-id', user_id: 'user_123' }],
    })

    const [req, context] = createRequest({ next_run_at: 'not-a-date' }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('next_run_at must be a valid ISO 8601 date string')
  })

  it('successfully updates next_run_at with valid date', async () => {
    const nextRunAt = '2024-02-01T12:00:00Z'
    const updatedAction = { 
      id: 'test-id', 
      user_id: 'user_123',
      next_run_at: nextRunAt,
      updated_at: '2024-01-15T10:00:00Z'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'test-id', user_id: 'user_123' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedAction],
      })

    const [req, context] = createRequest({ next_run_at: nextRunAt }, 'test-id', 'Bearer user_123')
    const response = await PATCH(req, context)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.next_run_at).toBe(nextRunAt)
  })
})
