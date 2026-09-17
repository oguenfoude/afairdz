import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotification, OrderData } from '@/lib/mailer';
import { syncOrderToGoogleSheet, updateOrderEmailStatus } from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Max execution duration for external APIs (Google Sheets + SMTP)

// In-memory cache for Rate Limiting / Anti-Spam
const orderCache = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fullName || !body.phone || !body.wilayaId) {
      return NextResponse.json(
        { error: 'يرجى إدخال الاسم الكامل، رقم الهاتف، والولاية.' },
        { status: 400 }
      );
    }

    // Anti-Spam: prevent rapid double-clicks for the same phone number within 60 seconds
    const cleanPhone = body.phone.trim().replace(/[\s\-]/g, '');
    const phoneKey = `phone_${cleanPhone}`;
    const now = Date.now();
    const cooldownMs = 60 * 1000; // 60 seconds cooldown

    // Clean cache if large
    if (orderCache.size > 10000) {
      orderCache.clear();
    }

    if (orderCache.has(phoneKey) && (now - orderCache.get(phoneKey)!) < cooldownMs) {
      console.log(`[AntiSpam] Duplicate order prevented for Phone: ${cleanPhone}`);
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        message: 'تم تأكيد طلبك بنجاح! لقد قمنا بتسجيل طلبك وسنتصل بك هاتفياً لتأكيد الشحن.'
      });
    }

    orderCache.set(phoneKey, now);

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' });

    const orderData: OrderData = {
      orderId,
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      phone2: body.phone2 ? body.phone2.trim() : undefined,
      wilayaId: Number(body.wilayaId),
      wilayaName: body.wilayaName || '',
      communeName: body.communeName || '',
      deliveryType: body.deliveryType === 'desk' ? 'desk' : 'domicile',
      addressDetails: body.addressDetails ? body.addressDetails.trim() : undefined,
      selectedModels: body.selectedModels || [],
      quantity: Number(body.quantity) || 1,
      productPrice: Number(body.productPrice) || 1500,
      deliveryFee: Number(body.deliveryFee) || 0,
      totalPrice: Number(body.totalPrice) || 1500,
      notes: body.notes ? body.notes.trim() : undefined,
      createdAt
    };

    // =========================================================================
    // STEP 1: STORE IN GOOGLE SHEETS & LOCAL CSV FIRST
    // =========================================================================
    console.log(`[Order Flow] 1/3 Storing order ${orderId} in Google Sheets & CSV...`);
    const sheetSyncResult = await syncOrderToGoogleSheet(orderData);

    // =========================================================================
    // STEP 2: DISPATCH EMAIL NOTIFICATION TO STORE ADMINS
    // =========================================================================
    console.log(`[Order Flow] 2/3 Dispatching email notification for order ${orderId}...`);
    let emailSent = false;
    try {
      const emailResult = await sendOrderNotification(orderData);
      if (
        emailResult &&
        (('accepted' in emailResult && Array.isArray(emailResult.accepted) && emailResult.accepted.length > 0) ||
         ('messageId' in emailResult && Boolean(emailResult.messageId)) ||
         ('simulated' in emailResult && emailResult.simulated))
      ) {
        emailSent = true;
        const recipients = ('accepted' in emailResult && Array.isArray(emailResult.accepted)) 
          ? emailResult.accepted.map(String).join(', ') 
          : 'kalijeogo@gmail.com';
        console.log(`✅ [Order Flow] Email delivered successfully to:`, recipients);
      } else {
        console.warn(`⚠️ [Order Flow] Email dispatched but acceptance unconfirmed:`, emailResult);
        emailSent = false;
      }
    } catch (mailErr) {
      console.error(`❌ [Order Flow] Email sending failed:`, mailErr);
      emailSent = false;
    }

    // =========================================================================
    // STEP 3: IF EMAIL SENT, MARK AS "تم الإرسال" IN GOOGLE SHEETS & LOCAL CSV
    // =========================================================================
    const finalEmailStatus = emailSent ? '✅ تم الإرسال' : '❌ فشل الإرسال';
    console.log(`[Order Flow] 3/3 Updating email status to "${finalEmailStatus}"...`);
    await updateOrderEmailStatus(orderData.orderId, finalEmailStatus, sheetSyncResult?.rowNumber);

    // Record the successful order in the AntiSpam cache
    orderCache.set(phoneKey, now);

    return NextResponse.json({
      success: true,
      orderId,
      emailSent,
      message: 'تم تأكيد طلبك بنجاح! سنتصل بك هاتفياً في أقرب وقت لتأكيد الشحن.'
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('Error submitting order:', e);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}
