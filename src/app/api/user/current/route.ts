
import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getSupabaseUser } from '@/lib/supabase-users';

export async function GET() {
  const { user } = await withAuth();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseUser = await getSupabaseUser(user.id);
    
    return NextResponse.json({
      workosUserId: user.id,
      aiName: supabaseUser?.ai_name || null,
      aiUsername: supabaseUser?.ai_username || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
