
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Stripe webhook verified:', event.type);

    // Initialize Supabase client
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

    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        console.log(`📦 Subscription ${event.type}:`, {
          customerId,
          subscriptionId,
          status
        });

        // First, try to get customer details from Stripe to find their email
        const customer = await stripe.customers.retrieve(customerId);
        const customerEmail = customer.email;

        console.log('📧 Customer email:', customerEmail);

        // Try to find user by stripe_customer_id first
        let { data: user, error: findError } = await supabase
          .from('users')
          .select()
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        // If no user found by stripe_customer_id, try to find by email and link them
        if (!user && customerEmail) {
          console.log('🔗 No user found by stripe_customer_id, searching by email...');
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select()
            .eq('email', customerEmail)
            .maybeSingle();

          if (userByEmail) {
            console.log('✅ Found user by email, linking stripe_customer_id...');
            user = userByEmail;
          } else {
            console.error('❌ No user found with email:', customerEmail);
            return NextResponse.json(
              { error: 'No user found with that email' },
              { status: 404 }
            );
          }
        }

        if (!user) {
          console.error('❌ No user found for customer:', customerId);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Update user with subscription details (and link stripe_customer_id if needed)
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update user subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
          );
        }

        console.log('✅ Updated user subscription in Supabase:', updatedUser);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer;

        console.log('🗑️ Subscription deleted for customer:', deletedCustomerId);

        // Update user to mark subscription as canceled
        const { error: deleteError } = await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', deletedCustomerId);

        if (deleteError) {
          console.error('Failed to update canceled subscription:', deleteError);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
