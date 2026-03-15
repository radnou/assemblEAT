// IMPORTANT: Set the following environment variables on Vercel (and in .env.local for local dev):
//   LEMONSQUEEZY_WEBHOOK_SECRET — found in Lemon Squeezy dashboard → Webhooks
//   LEMONSQUEEZY_API_KEY        — found in Lemon Squeezy dashboard → API Keys
//   NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL — your checkout link (embed mode)

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Verify the Lemon Squeezy webhook signature using HMAC-SHA256.
 * This is security-critical: rejects any request not signed by Lemon Squeezy.
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
    return false;
  }
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    // Buffers of different length would throw — treat as invalid signature
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-signature') ?? '';
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '';

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const meta = event.meta as Record<string, unknown> | undefined;
  const eventName = meta?.event_name as string | undefined;
  const customData = meta?.custom_data as Record<string, unknown> | undefined;
  const userId = customData?.user_id as string | undefined;

  const data = event.data as Record<string, unknown> | undefined;
  const subscriptionData = data?.attributes as Record<string, unknown> | undefined;

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_payment_success': {
      const status = subscriptionData?.status as string | undefined;
      const isActive = status != null && ['active', 'on_trial'].includes(status);

      if (userId && isActive) {
        // TODO: update Supabase user plan to 'pro' using service role key
        // Example (requires SUPABASE_SERVICE_ROLE_KEY):
        //   const { createClient } = await import('@supabase/supabase-js');
        //   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        //   await supabase.from('user_subscriptions').upsert({ user_id: userId, plan: 'pro', status });
        console.log(`[LemonSqueezy] User ${userId} subscription active: ${status}`);
      }
      break;
    }

    case 'subscription_cancelled':
    case 'subscription_expired': {
      if (userId) {
        // TODO: downgrade user to 'free' in Supabase
        console.log(`[LemonSqueezy] User ${userId} subscription cancelled/expired`);
      }
      break;
    }

    default:
      console.log(`[LemonSqueezy] Unhandled event: ${eventName}`);
  }

  return NextResponse.json({ received: true });
}
