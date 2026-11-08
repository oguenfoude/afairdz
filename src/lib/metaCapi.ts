import crypto from 'crypto';

function hashData(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export interface MetaCapiPayload {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData?: {
    phone?: string;
    email?: string;
    fbp?: string;
    fbc?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
  };
  testEventCode?: string;
}

/**
 * Direct Server-Side Meta Conversions API (CAPI) helper.
 * Executes in-process without looping through internal HTTP fetch.
 */
export async function sendMetaCapiEvent(payload: MetaCapiPayload) {
  const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  if (!ACCESS_TOKEN || !PIXEL_ID) {
    console.warn('[CAPI] Skipped: FACEBOOK_ACCESS_TOKEN or NEXT_PUBLIC_FACEBOOK_PIXEL_ID not configured.');
    return { skipped: true, reason: 'missing_credentials' };
  }

  const { eventName, eventId, eventSourceUrl, userData = {}, customData = {}, testEventCode } = payload;

  if (!eventName || !eventId) {
    return { error: 'eventName and eventId are required' };
  }

  // Build hashed user data required by Meta Graph API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hashedUserData: Record<string, any> = {};
  if (userData.phone) {
    const normalizedPhone = userData.phone.replace(/[\s\-]/g, '').replace(/^\+213/, '0');
    hashedUserData.ph = [hashData(normalizedPhone)];
  }
  if (userData.email) {
    hashedUserData.em = [hashData(userData.email)];
  }
  if (userData.fbp) hashedUserData.fbp = userData.fbp;
  if (userData.fbc) hashedUserData.fbc = userData.fbc;
  if (userData.clientIpAddress) hashedUserData.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent) hashedUserData.client_user_agent = userData.clientUserAgent;

  const eventPayload: Record<string, any> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://affaire-dz.com',
        action_source: 'website',
        user_data: hashedUserData,
        custom_data: customData,
      },
    ],
  };

  const activeTestCode = testEventCode || process.env.META_TEST_EVENT_CODE;
  if (activeTestCode) {
    eventPayload.test_event_code = activeTestCode;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      console.error('[CAPI] Meta API error:', result);
      return { error: result };
    }

    console.log(`[CAPI] ✅ Event "${eventName}" (ID: ${eventId}) delivered to Meta. EMQ/Received: ${result?.events_received}`);
    return { success: true, events_received: result?.events_received };
  } catch (err) {
    console.error('[CAPI] Network/Internal error:', err);
    return { error: 'internal_error' };
  }
}
