import { NextRequest, NextResponse } from 'next/server';
import { sendAbandonedLeadNotification, AbandonedLeadData } from '@/lib/mailer';
import { syncLeadToGoogleSheet } from '@/lib/googleSheet';

// In-memory cache to throttle duplicate notifications
const recentLeads = new Map<string, { timestamp: number; summary: string }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const phone = (body.phone || '').trim().replace(/[\s\-]/g, '');
    const fullName = (body.fullName || '').trim();
    const wilayaName = (body.wilayaName || '').trim();
    const communeName = (body.communeName || '').trim();

    // Reject incomplete or invalid data: Name, Algerian Phone, Wilaya, and Commune are mandatory
    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ skipped: true, reason: 'Full name required' });
    }
    if (!phone || !/^(0)?(5|6|7)[0-9]{8}$/.test(phone)) {
      return NextResponse.json({ skipped: true, reason: 'Valid Algerian phone number required' });
    }
    if (!wilayaName || !communeName) {
      return NextResponse.json({ skipped: true, reason: 'Wilaya and Commune are required' });
    }
    if (body.stage === 'input_blur') {
      return NextResponse.json({ skipped: true, reason: 'Premature blur events ignored' });
    }

    const currentSummary = `${body.fullName || ''}-${body.wilayaName || ''}-${body.communeName || ''}-${body.selectedModels?.[0]?.modelId || ''}`;
    const lastRecord = recentLeads.get(phone);
    const now = Date.now();

    // If we already sent a notification for this phone number in the last 30 minutes, skip completely
    if (lastRecord && now - lastRecord.timestamp < 30 * 60 * 1000) {
      return NextResponse.json({ skipped: true, reason: 'Already notified recently for this phone number' });
    }

    recentLeads.set(phone, { timestamp: now, summary: currentSummary });

    // Clean up old entries (> 2 hours)
    if (recentLeads.size > 500) {
      for (const [key, val] of recentLeads.entries()) {
        if (now - val.timestamp > 2 * 60 * 60 * 1000) {
          recentLeads.delete(key);
        }
      }
    }

    const leadData: AbandonedLeadData = {
      leadId: 'LEAD-' + Math.floor(10000 + Math.random() * 90000),
      fullName: (body.fullName || '').trim(),
      phone,
      wilayaName: body.wilayaName || '',
      communeName: body.communeName || '',
      deliveryType: body.deliveryType,
      addressDetails: (body.addressDetails || '').trim(),
      selectedModels: body.selectedModels || [],
      estimatedTotal: body.estimatedTotal,
      abandonedAt: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
      stage: body.stage || 'input_change'
    };

    console.log(`[Lead Captured] Phone: ${phone}, Wilaya: ${leadData.wilayaName}, Model: ${leadData.selectedModels?.[0]?.modelName || 'None'}`);

    await Promise.allSettled([
      sendAbandonedLeadNotification(leadData),
      syncLeadToGoogleSheet(leadData)
    ]);

    return NextResponse.json({ success: true, leadId: leadData.leadId });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('Error logging abandoned lead:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
