
import { NextResponse } from 'next/server';
import { SUPABASE_URL, HEADERS } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?ai_username=eq.${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const available = !Array.isArray(data) || data.length === 0;

    return NextResponse.json({ available });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Failed to check username' }, { status: 500 });
  }
}
