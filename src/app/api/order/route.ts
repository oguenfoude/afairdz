import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotification, OrderData } from '@/lib/mailer';
import { syncOrderToGoogleSheet } from '@/lib/googleSheet';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fullName || !body.phone || !body.wilayaId) {
      return NextResponse.json(
        { error: 'يرجى إدخال الاسم الكامل، رقم الهاتف، والولاية.' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      orderId,
      message: 'تم تأكيد طلبك بنجاح! سنتصل بك هاتفياً في أقرب وقت لتأكيد الشحن.'
    });
  } catch (error: any) {
    console.error('Error submitting order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}
