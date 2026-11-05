import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashData(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * POST /api/capi
 * Server-side Conversions API (CAPI) proxy to Meta Graph API.
 * Pairs with the client-side Facebook Pixel via matching eventID for deduplication.
 *
 * Body: { eventName, eventId, eventSourceUrl, userData?, customData? }
 * userData: { phone?, email?, fbp?, fbc? }
 * customData: { currency, value, content_name?, content_ids? }
 */
export async function POST(req: NextRequest) {
  try {
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
    const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

    if (!ACCESS_TOKEN || !PIXEL_ID) {
      // Not an error — CAPI is optional. Log and return 200 so order flow isn't disrupted.
      console.warn('[CAPI] Skipped: FACEBOOK_ACCESS_TOKEN or NEXT_PUBLIC_FACEBOOK_PIXEL_ID not set.');
      return NextResponse.json({ skipped: true, reason: 'missing_credentials' });
    }

    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = body;

    if (!eventName || !eventId) {
      return NextResponse.json({ error: 'eventName and eventId are required' }, { status: 400 });
    }

    // Build hashed user data (Meta requires SHA-256)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hashedUserData: Record<string, any> = {};
    if (userData.phone) {
      // Normalize Algerian phone: strip spaces, dashes, leading +213 → 0
      const normalizedPhone = userData.phone.replace(/[\s\-]/g, '').replace(/^\+213/, '0');
      hashedUserData.ph = [hashData(normalizedPhone)];
    }
    if (userData.email) {
      hashedUserData.em = [hashData(userData.email)];
    }
    if (userData.fbp) hashedUserData.fbp = userData.fbp;
    if (userData.fbc) hashedUserData.fbc = userData.fbc;

    // Client context
    const clientIpAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';
    const clientUserAgent = req.headers.get('user-agent') || '';

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://affaire-dz.com',
          action_source: 'website',
          user_data: {
            ...hashedUserData,
            client_ip_address: clientIpAddress,
            client_user_agent: clientUserAgent,
          },
          custom_data: customData,
        },
      ],
      // Uncomment during testing to see events in Meta Events Manager → Test Events tab:
      // test_event_code: 'TEST12345',
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await metaRes.json();

    if (!metaRes.ok) {
      console.error('[CAPI] Meta API error:', result);
      return NextResponse.json({ error: result }, { status: 400 });
    }

    console.log(`[CAPI] ✅ Event "${eventName}" (${eventId}) sent to Meta. EMQ: ${result?.events_received}`);
    return NextResponse.json({ success: true, events_received: result?.events_received });
  } catch (err) {
    console.error('[CAPI] Internal error:', err);
    // Never let CAPI errors break the calling flow
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
