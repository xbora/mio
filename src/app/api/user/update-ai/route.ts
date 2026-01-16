
import { NextResponse } from 'next/server';
import { updateSupabaseUser } from '@/lib/supabase-users';

export async function POST(request: Request) {
  try {
    const { workosUserId, aiName, aiUsername } = await request.json();

    if (!workosUserId || !aiName || !aiUsername) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedUser = await updateSupabaseUser(workosUserId, {
      ai_name: aiName,
      ai_username: aiUsername,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update AI configuration' },
      { status: 500 }
    );
  }
}
