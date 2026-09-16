import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotification, OrderData } from '@/lib/mailer';
import { syncOrderToGoogleSheet } from '@/lib/googleSheet';

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

    // Anti-Spam Check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const cleanPhone = body.phone.trim().replace(/[\s\-]/g, '');
    const ipKey = `ip_${ip}`;
    const phoneKey = `phone_${cleanPhone}`;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Periodically clean cache to prevent memory leak on long-running instances
    if (orderCache.size > 10000) {
      orderCache.clear();
    }

    // Block if IP or Phone has ordered in the last 24 hours
    if ((orderCache.has(ipKey) && (now - orderCache.get(ipKey)!) < twentyFourHours) ||
        (orderCache.has(phoneKey) && (now - orderCache.get(phoneKey)!) < twentyFourHours)) {
      
      console.log(`[AntiSpam] Blocked duplicate order from IP: ${ip} | Phone: ${cleanPhone}`);
      
      // Return a FAKE success response so they stop spamming, but flag as duplicate so pixel never fires
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        message: 'تم تأكيد طلبك بنجاح! لقد قمنا بتسجيل طلبك مسبقاً وسنتصل بك هاتفياً في أقرب وقت لتأكيد الشحن.'
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

    // Dispatch notification email and sync to Google Sheets / CSV in parallel
    const results = await Promise.allSettled([
      sendOrderNotification(orderData),
      syncOrderToGoogleSheet(orderData)
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Order Sync Error - Task ${index}]:`, result.reason);
      }
    });

    // Record the successful order in the AntiSpam cache
    if (ip !== 'unknown') orderCache.set(ipKey, now);
    orderCache.set(phoneKey, now);

    return NextResponse.json({
      success: true,
      orderId,
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
