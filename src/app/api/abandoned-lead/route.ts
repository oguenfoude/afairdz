import { NextRequest, NextResponse } from 'next/server';
import { sendAbandonedLeadNotification, AbandonedLeadData } from '@/lib/mailer';
import { syncLeadToGoogleSheet } from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Cache to prevent duplicate abandoned lead notifications for the same phone within 24h
const leadCache = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const cleanPhone = (body.phone || '').trim().replace(/[\s\-]/g, '');
    const fullName = (body.fullName || '').trim();

    const wilayaName = (body.wilayaName || '').trim();
    const communeName = (body.communeName || '').trim();
    const addressDetails = (body.addressDetails || '').trim();

    // Strictest validation: customer MUST have filled out ALL form fields!
    // If ANY required field is missing or empty, do NOT record as abandoned lead.
    if (
      fullName.length < 2 ||
      !/^(0)(5|6|7)[0-9]{8}$/.test(cleanPhone) ||
      !wilayaName ||
      !communeName ||
      addressDetails.length < 2
    ) {
      return NextResponse.json(
        { error: 'بيانات غير مكتملة. لا يتم تسجيل السلة المتروكة إلا بعد إكمال كامل حقول الاستمارة.' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Clean cache if large
    if (leadCache.size > 5000) leadCache.clear();

    // If this phone was already captured in the last 24h, skip silently
    if (leadCache.has(cleanPhone) && (now - leadCache.get(cleanPhone)!) < twentyFourHours) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    leadCache.set(cleanPhone, now);

    const leadId = 'LEAD-' + Math.floor(10000 + Math.random() * 90000);
    const abandonedAt = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' });

    const leadData: AbandonedLeadData = {
      leadId,
      fullName,
      phone: cleanPhone,
      wilayaName,
      communeName,
      deliveryType: body.deliveryType === 'desk' ? 'desk' : 'domicile',
      addressDetails,
      selectedModels: body.selectedModels || [],
      estimatedTotal: Number(body.estimatedTotal) || 2200,
      abandonedAt,
      stage: body.stage || 'page_leave'
    };

    // 1. Sync to Google Sheets 'السلات المتروكة'
    await syncLeadToGoogleSheet(leadData);

    // 2. Send email notification to kalijeogo@gmail.com
    await sendAbandonedLeadNotification(leadData);

    return NextResponse.json({ success: true, leadId });
  } catch (error: unknown) {
    console.error('Error recording abandoned lead:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ السلة المتروكة.' }, { status: 500 });
  }
}
