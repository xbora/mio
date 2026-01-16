
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('WORKOS_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body and headers
    const payload = await request.text();

    // Get WorkOS signature header (format: "t=<timestamp>, v1=<signature>")
    const workosSignature = request.headers.get('workos-signature');

    if (!workosSignature) {
      console.error('Missing workos-signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    console.log('📬 WorkOS signature:', workosSignature);

    // Parse WorkOS signature format: "t=<timestamp>, v1=<signature>"
    const parts = workosSignature.split(', ');
    const timestampMatch = parts[0]?.match(/t=(\d+)/);
    const signatureMatch = parts[1]?.match(/v1=([a-f0-9]+)/);

    if (!timestampMatch || !signatureMatch) {
      console.error('Invalid signature format');
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 401 }
      );
    }

    const timestamp = timestampMatch[1];
    const expectedSignature = signatureMatch[1];

    console.log('🔍 Parsed timestamp:', timestamp);
    console.log('🔍 Expected signature:', expectedSignature);

    // Verify the webhook signature manually using HMAC
    // WorkOS signature is: HMAC-SHA256(secret, timestamp.payload)
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = createHmac('sha256', webhookSecret);
    hmac.update(signedPayload);
    const computedSignature = hmac.digest('hex');

    console.log('🔍 Computed signature:', computedSignature);

    if (computedSignature !== expectedSignature) {
      console.error('❌ Signature mismatch');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Webhook signature verified successfully');

    // Parse the event payload
    let evt: any;
    try {
      evt = JSON.parse(payload);
    } catch (err) {
      console.error('❌ Error parsing webhook payload:', err);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    console.log('📦 Full webhook event data:', JSON.stringify(evt, null, 2));
    console.log('🔔 Event type:', evt.event);
    console.log('👤 User ID from event:', evt.data?.id);

    // Handle both user.created and user.updated events
    if (evt.event === 'user.created' || evt.event === 'user.updated') {
      const workosUserId = evt.data?.id;

      if (!workosUserId) {
        console.error('❌ No user ID found in webhook data');
        return NextResponse.json(
          { error: 'No user ID in webhook data' },
          { status: 400 }
        );
      }

      console.log(`📬 Processing ${evt.event} event for user ID: ${workosUserId}`);

      // Initialize Supabase client with service_role key for elevated permissions
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      console.log('🔑 Supabase URL configured:', !!supabaseUrl);
      console.log('🔑 Supabase Service Role Key configured:', !!supabaseServiceRoleKey);

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('❌ Supabase credentials not configured');
        return NextResponse.json(
          { error: 'Supabase credentials not configured' },
          { status: 500 }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('workos_user_id', workosUserId)
        .maybeSingle();

      console.log('🔍 Existing user check:', existingUser ? 'Found' : 'Not found');
      if (checkError) {
        console.error('❌ Error checking existing user:', checkError);
      }

      let currentUser = existingUser;

      if (!existingUser) {
        // Create user record in Supabase
        console.log('📝 Attempting to insert user into Supabase...');
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([
            {
              workos_user_id: workosUserId,
              email: evt.data.email,
              name: evt.data.first_name && evt.data.last_name 
                ? `${evt.data.first_name} ${evt.data.last_name}` 
                : evt.data.first_name || evt.data.last_name || null,
              first_name: evt.data.first_name,
              last_name: evt.data.last_name,
              ai_name: evt.data.first_name ? `${evt.data.first_name}'s AI` : null
            }
          ])
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to create user in Supabase:`, error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              details: error
            },
            { status: 500 }
          );
        }

        console.log(`✅ Successfully created user in Supabase:`, JSON.stringify(newUser, null, 2));
        currentUser = newUser;
      } else {
        console.log(`✅ User already exists in Supabase with ID: ${existingUser.id}`);
      }

      // Now create WorkOS users in Memkit and Arca organizations
      const memkitClientId = process.env.MEMKIT_WORKOS_CLIENT_ID;
      const memkitApiKey = process.env.MEMKIT_WORKOS_API_KEY;
      const arcaClientId = process.env.ARCA_WORKOS_CLIENT_ID;
      const arcaApiKey = process.env.ARCA_WORKOS_API_KEY;

      console.log('🔑 Memkit WorkOS Client ID configured:', !!memkitClientId);
      console.log('🔑 Memkit WorkOS API Key configured:', !!memkitApiKey);
      console.log('🔑 Arca WorkOS Client ID configured:', !!arcaClientId);
      console.log('🔑 Arca WorkOS API Key configured:', !!arcaApiKey);

      const updates: any = {};

      // Create Memkit user
      if (memkitClientId && memkitApiKey && !currentUser.memkit_workos_user_id) {
        try {
          console.log('🏗️ Creating WorkOS user in Memkit organization...');
          
          const memkitUserResponse = await fetch('https://api.workos.com/user_management/users', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${memkitApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: evt.data.email,
              first_name: evt.data.first_name,
              last_name: evt.data.last_name,
            }),
          });

          let memkitUser;

          if (!memkitUserResponse.ok) {
            const errorText = await memkitUserResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            const isEmailNotAvailable = errorData.errors?.some(
              (err: any) => err.code === 'email_not_available'
            );

            if (isEmailNotAvailable) {
              console.log('ℹ️ User already exists in Memkit, fetching existing user...');
              
              const listUsersResponse = await fetch(
                `https://api.workos.com/user_management/users?email=${encodeURIComponent(evt.data.email)}`,
                {
                  headers: {
                    'Authorization': `Bearer ${memkitApiKey}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (listUsersResponse.ok) {
                const listData = await listUsersResponse.json();
                if (listData.data && listData.data.length > 0) {
                  memkitUser = listData.data[0];
                  console.log('✅ Found existing Memkit WorkOS user:', JSON.stringify(memkitUser, null, 2));
                }
              }
            } else {
              console.error('❌ Failed to create Memkit WorkOS user:', errorText);
            }
          } else {
            memkitUser = await memkitUserResponse.json();
            console.log('✅ Created Memkit WorkOS user:', JSON.stringify(memkitUser, null, 2));
          }

          if (memkitUser) {
            updates.memkit_workos_user_id = memkitUser.id;
          }

        } catch (memkitError) {
          console.error('❌ Error creating Memkit WorkOS user:', memkitError);
        }
      }

      // Create Arca user
      if (arcaClientId && arcaApiKey && !currentUser.arca_workos_user_id) {
        try {
          console.log('🏗️ Creating WorkOS user in Arca organization...');
          
          const arcaUserResponse = await fetch('https://api.workos.com/user_management/users', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${arcaApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: evt.data.email,
              first_name: evt.data.first_name,
              last_name: evt.data.last_name,
            }),
          });

          let arcaUser;

          if (!arcaUserResponse.ok) {
            const errorText = await arcaUserResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            const isEmailNotAvailable = errorData.errors?.some(
              (err: any) => err.code === 'email_not_available'
            );

            if (isEmailNotAvailable) {
              console.log('ℹ️ User already exists in Arca, fetching existing user...');
              
              const listUsersResponse = await fetch(
                `https://api.workos.com/user_management/users?email=${encodeURIComponent(evt.data.email)}`,
                {
                  headers: {
                    'Authorization': `Bearer ${arcaApiKey}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (listUsersResponse.ok) {
                const listData = await listUsersResponse.json();
                if (listData.data && listData.data.length > 0) {
                  arcaUser = listData.data[0];
                  console.log('✅ Found existing Arca WorkOS user:', JSON.stringify(arcaUser, null, 2));
                }
              }
            } else {
              console.error('❌ Failed to create Arca WorkOS user:', errorText);
            }
          } else {
            arcaUser = await arcaUserResponse.json();
            console.log('✅ Created Arca WorkOS user:', JSON.stringify(arcaUser, null, 2));
          }

          if (arcaUser) {
            updates.arca_workos_user_id = arcaUser.id;
          }

        } catch (arcaError) {
          console.error('❌ Error creating Arca WorkOS user:', arcaError);
        }
      }

      // Update Supabase user with Memkit and Arca WorkOS user IDs if any were created
      if (Object.keys(updates).length > 0) {
        console.log('📝 Updating Supabase user with WorkOS user IDs...');
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', currentUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Failed to update Supabase user with WorkOS IDs:', updateError);
          return NextResponse.json({
            success: true,
            message: 'Users created but failed to link',
            user: currentUser,
            linkError: updateError.message
          });
        }

        console.log('✅ Successfully linked users:', JSON.stringify(updatedUser, null, 2));
        currentUser = updatedUser;
      }

      return NextResponse.json({
        success: true,
        message: 'User processed successfully',
        user: currentUser
      });
    }

    // For other event types, just acknowledge receipt
    console.log(`📬 Webhook received: ${evt.event} (not handling this event type)`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
