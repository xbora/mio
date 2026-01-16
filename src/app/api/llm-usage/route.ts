
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const {
      user_id,
      completion_tokens,
      prompt_tokens,
      total_tokens,
      model_name,
      request_type,
      estimated_cost_usd,
      tool_calls_count,
      llm_calls_count,
      session_id,
      endpoint
    } = body;

    if (!user_id || !completion_tokens || !prompt_tokens || !total_tokens || !model_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, completion_tokens, prompt_tokens, total_tokens, model_name' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service_role key for elevated permissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Insert LLM usage record
    const { data, error } = await supabase
      .from('llm_usage')
      .insert({
        user_id,
        completion_tokens,
        prompt_tokens,
        total_tokens,
        model_name,
        request_type: request_type || null,
        estimated_cost_usd: estimated_cost_usd || null,
        tool_calls_count: tool_calls_count || 0,
        llm_calls_count: llm_calls_count || 1,
        session_id: session_id || null,
        endpoint: endpoint || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting LLM usage:', error);
      return NextResponse.json(
        { error: 'Failed to insert LLM usage', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error processing LLM usage request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
