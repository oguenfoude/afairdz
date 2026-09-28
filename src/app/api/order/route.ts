import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotification, OrderData } from '@/lib/mailer';
import { syncOrderToGoogleSheet, updateOrderEmailStatus } from '@/lib/googleSheet';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Max execution duration for external APIs (Google Sheets + SMTP)

// In-memory cache for Rate Limiting / Anti-Spam
// Stores the last order payload per phone so duplicates return REAL order info.
const orderCache = new Map<string, { timestamp: number; order: OrderData }>();
const DOUBLE_CLICK_MS = 60 * 1000; // 60 seconds double-click guard
const SAME_PHONE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h same-phone notice window

function logDuplicateAttempt(cleanPhone: string, original: OrderData) {
  // Best-effort local log only — never throws, never affects the response.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const csvFile = path.join(dataDir, 'duplicates.csv');
    const fileExists = fs.existsSync(csvFile);
    const modelNames = original.selectedModels.map(m => m.modelName).join(' + ') || 'غير محدد';
    const row = [
      `"${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })}"`,
      `"${original.orderId}"`,
      `"${original.fullName}"`,
      `"${cleanPhone}"`,
      `"${original.wilayaName} (${original.wilayaId})"`,
      `"${original.communeName}"`,
      `"${modelNames}"`,
      original.totalPrice,
      `"مكرر — سنتصل بالزبون"`
    ].join(',');
    if (!fileExists) {
      const header = '"تاريخ المحاولة المكررة","رقم الطلب الأصلي","الاسم","الهاتف","الولاية","البلدية","الموديل","المجموع (دج)","الحالة"\n';
      fs.writeFileSync(csvFile, '\uFEFF' + header + row + '\n', 'utf8');
    } else {
      fs.appendFileSync(csvFile, row + '\n', 'utf8');
    }
  } catch (e) {
    console.warn('⚠️ [Duplicate Log Error]', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fullName || !body.phone || !body.wilayaId) {
      return NextResponse.json(
        { error: 'يرجى إدخال الاسم الكامل، رقم الهاتف، والولاية.' },
        { status: 400 }
      );
    }

    // Anti-Spam: 60s double-click guard + 24h same-phone notice window.
    // Duplicates return the ORIGINAL orderId + ORIGINAL payload (never random ids),
    // never touch Google Sheets as a new order, never send admin email, never count for Meta.
    const cleanPhone = body.phone.trim().replace(/[\s\-]/g, '');
    const phoneKey = `phone_${cleanPhone}`;
    const now = Date.now();

    // Clean cache if large
    if (orderCache.size > 10000) {
      orderCache.clear();
    }

    const cached = orderCache.get(phoneKey);
    if (cached && (now - cached.timestamp) < SAME_PHONE_WINDOW_MS) {
      const isDoubleClick = (now - cached.timestamp) < DOUBLE_CLICK_MS;
      console.log(`[AntiSpam] Duplicate order (${isDoubleClick ? 'double-click' : 'same-phone 24h'}) for Phone: ${cleanPhone}, original: ${cached.order.orderId}`);
      // Best-effort seller callback log (local CSV + console only, never fails response)
      try {
        logDuplicateAttempt(cleanPhone, cached.order);
      } catch { /* never fail */ }
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        orderId: cached.order.orderId,
        order: cached.order,
        message: 'طلبك مسجّل مسبقاً — سنتصل بك هاتفياً لتأكيد الشحن.'
      });
    }

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

    // Register in-flight order immediately so rapid double-clicks during
    // the Sheets/email round-trip also resolve to this ORIGINAL orderId.
    orderCache.set(phoneKey, { timestamp: now, order: orderData });

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

    // Refresh the successful order in the AntiSpam cache with final payload
    orderCache.set(phoneKey, { timestamp: now, order: orderData });

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
