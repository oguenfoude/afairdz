import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

interface OrderItem {
  modelId: number;
  modelName: string;
  image: string;
}

export interface OrderData {
  orderId: string;
  fullName: string;
  phone: string;
  phone2?: string;
  wilayaId: number;
  wilayaName: string;
  communeName: string;
  deliveryType: 'desk' | 'domicile';
  addressDetails?: string;
  selectedModels: OrderItem[];
  quantity: number;
  productPrice: number;
  deliveryFee: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export interface AbandonedLeadData {
  leadId: string;
  fullName: string;
  phone: string;
  wilayaName?: string;
  communeName?: string;
  deliveryType?: 'desk' | 'domicile';
  addressDetails?: string;
  selectedModels?: OrderItem[];
  estimatedTotal?: number;
  abandonedAt: string;
  stage: 'idle_timeout' | 'page_leave' | 'tab_hidden' | string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.GOOGLE_EMAIL || process.env.SMTP_USER;
  const pass = process.env.GOOGLE_APP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass || pass.includes('xxxx')) {
    return null; // Not configured yet
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kalijeogo@gmail.com, hama07102@gmail.com';
const SENDER_EMAIL = process.env.EMAIL_FROM || `"Affaire DZ" <${process.env.SMTP_USER || 'noreply@afairdz.com'}>`;

export async function sendOrderNotification(order: OrderData) {
  const deliveryTypeLabel = order.deliveryType === 'desk' ? 'استلام من المكتب (500 دج)' : 'توصيل لباب المنزل (700 دج)';
  const attachments: Array<{ filename: string; path: string; cid?: string }> = [];

  // 1. Attach Brand Logo if exists
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  let hasLogo = false;
  if (fs.existsSync(logoPath)) {
    hasLogo = true;
    attachments.push({
      filename: 'logo.png',
      path: logoPath,
      cid: 'brand_logo'
    });
  }

  // 2. Attach Selected Watch Model Images for Gmail display
  const modelsHtml = order.selectedModels.map((m, idx) => {
    let imgHtml = '';
    if (m.image) {
      const cleanImgRel = m.image.replace(/^\//, '');
      const fullImgPath = path.join(process.cwd(), 'public', cleanImgRel);
      if (fs.existsSync(fullImgPath)) {
        const cidKey = `model_image_${idx}`;
        attachments.push({
          filename: `${m.modelName.replace(/[\s\/]/g, '_')}_${m.modelId}.webp`,
          path: fullImgPath,
          cid: cidKey
        });
        imgHtml = `<img src="cid:${cidKey}" alt="${m.modelName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />`;
      }
    }

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; width: 90px; text-align: center; vertical-align: middle;">
          ${imgHtml || '<span style="font-size: 11px; color: #94a3b8;">صورة</span>'}
        </td>
        <td style="padding: 12px; text-align: right; vertical-align: middle;">
          <div style="font-size: 15px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px;">${m.modelName}</div>
          <div style="font-size: 12px; color: #64748b;">موديل رقم #${m.modelId} • ساعة + خاتم وبراسلي مجاناً داخل علبة</div>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #1e1b4b; padding: 30px 20px; text-align: center; border-bottom: 4px solid #dc2626; }
        .header img { max-height: 60px; margin-bottom: 15px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .badge { background-color: #10b981; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-top: 10px; }
        .content { padding: 30px; }
        .section-title { font-size: 18px; color: #1e1b4b; font-weight: 700; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .info-table th { width: 35%; padding: 12px 15px; background-color: #f8fafc; color: #475569; font-weight: 600; text-align: right; border: 1px solid #e2e8f0; font-size: 14px; }
        .info-table td { padding: 12px 15px; border: 1px solid #e2e8f0; font-size: 15px; color: #1e293b; font-weight: 500; }
        .phone-link { color: #dc2626; font-weight: 700; text-decoration: none; font-size: 16px; display: inline-flex; align-items: center; gap: 5px; }
        .items-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        .items-table td { padding: 15px; border-bottom: 1px solid #e2e8f0; background: #ffffff; }
        .items-table tr:last-child td { border-bottom: none; }
        .summary-box { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; padding: 20px; margin-top: 10px; border: 1px solid #cbd5e1; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px; color: #475569; }
        .summary-row.total { font-size: 22px; font-weight: 800; color: #1e1b4b; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #cbd5e1; margin-bottom: 0; }
        .footer { text-align: center; padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
        .btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #2563eb; color: #ffffff; padding: 16px 20px; text-decoration: none; font-size: 18px; font-weight: 700; border-radius: 8px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${hasLogo ? '<img src="cid:brand_logo" alt="Affaire DZ" />' : '<h2 style="color:white; margin:0; margin-bottom: 10px; font-size: 28px;">Affaire DZ</h2>'}
          <h1>طلب شراء جديد #${order.orderId}</h1>
          <div class="badge">تم تأكيد الطلب بنجاح ✅</div>
        </div>
        
        <div class="content">
          <div style="text-align: center; color: #64748b; font-size: 13px; margin-bottom: 25px;">
            تاريخ الطلب: <span dir="ltr">${order.createdAt}</span>
          </div>

          <div class="section-title">👤 تفاصيل العميل</div>
          <table class="info-table">
            <tr>
              <th>الاسم واللقب</th>
              <td>${order.fullName}</td>
            </tr>
            <tr>
              <th>رقم الهاتف</th>
              <td><a href="tel:${order.phone}" class="phone-link">📞 <span dir="ltr">${order.phone}</span></a></td>
            </tr>
            <tr>
              <th>الولاية</th>
              <td>${order.wilayaName} (${order.wilayaId})</td>
            </tr>
            <tr>
              <th>البلدية</th>
              <td>${order.communeName || '---'}</td>
            </tr>
            <tr>
              <th>طريقة الاستلام</th>
              <td><strong style="color: #047857;">${deliveryTypeLabel}</strong></td>
            </tr>
            <tr>
              <th>العنوان التفصيلي</th>
              <td>${order.addressDetails || '---'}</td>
            </tr>
            ${order.notes ? `<tr><th>ملاحظات</th><td style="color: #dc2626; font-weight: 600;">${order.notes}</td></tr>` : ''}
          </table>

          <div class="section-title">📦 المنتجات المطلوبة (${order.quantity} قطعة)</div>
          <table class="items-table">
            ${modelsHtml}
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span>سعر المنتجات:</span>
              <strong dir="ltr">${order.productPrice} دج</strong>
            </div>
            <div class="summary-row">
              <span>تكلفة التوصيل:</span>
              <strong dir="ltr">${order.deliveryFee} دج</strong>
            </div>
            <div class="summary-row total">
              <span>المجموع النهائي:</span>
              <span dir="ltr" style="color: #dc2626;">${order.totalPrice} دج</span>
            </div>
          </div>

          <a href="tel:${order.phone}" class="btn">📞 الاتصال بالزبون الآن للتأكيد</a>
        </div>
        
        <div class="footer">
          تم إرسال هذا البريد تلقائياً من نظام متجر Affaire DZ<br>
          © ${new Date().getFullYear()} جميع الحقوق محفوظة
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('⚠️ [SMTP Notice] SMTP not configured. Order payload logged:');
    console.log(JSON.stringify(order, null, 2));
    return { success: true, simulated: true };
  }

  const mailOptions = {
    from: SENDER_EMAIL,
    to: ADMIN_EMAIL,
    subject: `✅ [Affaire DZ] طلب جديد: ${order.fullName} - ${order.wilayaName} (${order.totalPrice} دج)`,
    html,
    attachments
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendAbandonedLeadNotification(lead: AbandonedLeadData) {
  const attachments: Array<{ filename: string; path: string; cid?: string }> = [];

  // 1. Attach Brand Logo
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  let hasLogo = false;
  if (fs.existsSync(logoPath)) {
    hasLogo = true;
    attachments.push({ filename: 'logo.png', path: logoPath, cid: 'brand_logo' });
  }

  // 2. Attach Selected Watch Model Images for Gmail display
  let modelsHtml = '';
  if (lead.selectedModels && lead.selectedModels.length > 0) {
    const rowsHtml = lead.selectedModels.map((m, idx) => {
      let imgHtml = '';
      if (m.image) {
        const cleanImgRel = m.image.replace(/^\//, '');
        const fullImgPath = path.join(process.cwd(), 'public', cleanImgRel);
        if (fs.existsSync(fullImgPath)) {
          const cidKey = `lead_model_img_${idx}`;
          attachments.push({
            filename: `${m.modelName.replace(/[\s\/]/g, '_')}_${m.modelId}.webp`,
            path: fullImgPath,
            cid: cidKey
          });
          imgHtml = `<img src="cid:${cidKey}" alt="${m.modelName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />`;
        }
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; width: 90px; text-align: center; vertical-align: middle;">
            ${imgHtml || '<span style="font-size: 11px; color: #94a3b8;">صورة</span>'}
          </td>
          <td style="padding: 12px; text-align: right; vertical-align: middle;">
            <div style="font-size: 15px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px;">${m.modelName}</div>
            <div style="font-size: 12px; color: #64748b;">موديل رقم #${m.modelId} • اختاره العميل قبل المغادرة</div>
          </td>
        </tr>
      `;
    }).join('');
    
    modelsHtml = `
      <div style="font-size: 18px; color: #1e1b4b; font-weight: 700; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; margin-top: 25px; display: flex; align-items: center;">📦 الموديل الذي كان يود شراءه:</div>
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: white;">
        ${rowsHtml}
      </table>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #fef2f2; padding: 25px 20px; text-align: center; border-bottom: 4px solid #ef4444; }
        .header img { max-height: 50px; margin-bottom: 15px; }
        .badge { background-color: #ef4444; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; display: inline-block; margin-bottom: 12px; }
        .header h2 { color: #991b1b; margin: 0; font-size: 20px; font-weight: 800; line-height: 1.4; }
        .content { padding: 30px; }
        .desc { background: #fff8f1; border-right: 4px solid #f97316; padding: 15px; border-radius: 6px; color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .info-table th { width: 35%; padding: 12px 15px; background-color: #fafaf9; color: #57534e; font-weight: 600; text-align: right; border: 1px solid #e7e5e4; font-size: 14px; }
        .info-table td { padding: 12px 15px; border: 1px solid #e7e5e4; font-size: 15px; color: #1c1917; font-weight: 500; }
        .phone-link { color: #dc2626; font-weight: 800; text-decoration: none; font-size: 18px; display: inline-flex; align-items: center; gap: 5px; }
        .footer { text-align: center; padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
        .btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #dc2626; color: #ffffff; padding: 16px 20px; text-decoration: none; font-size: 18px; font-weight: 700; border-radius: 8px; margin-top: 15px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${hasLogo ? '<img src="cid:brand_logo" alt="Affaire DZ" />' : ''}
          <div><div class="badge">⚠️ طلب غير مكتمل (متروك)</div></div>
          <h2>عميل مهتم بدأ بتسجيل معلوماته ولم يكمل الطلب</h2>
        </div>
        
        <div class="content">
          <div style="text-align: center; color: #64748b; font-size: 13px; margin-bottom: 20px;">
            توقيت المحاولة: <span dir="ltr">${lead.abandonedAt}</span>
          </div>

          <div class="desc">
            <strong>فرصة مبيعات!</strong> بدأ هذا الزائر باختيار المنتج وكتابة معلوماته ولكنه توقف أو غادر قبل تأكيد الطلب. اتصل به الآن لإتمام الطلب.
          </div>

          <div style="font-size: 18px; color: #1e1b4b; font-weight: 700; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center;">👤 ما كتبه العميل:</div>
          <table class="info-table">
            <tr>
              <th>الاسم</th>
              <td>${lead.fullName || '<span style="color:#a8a29e">لم يكتبه بعد</span>'}</td>
            </tr>
            <tr>
              <th>رقم الهاتف</th>
              <td><a href="tel:${lead.phone}" class="phone-link">📞 <span dir="ltr">${lead.phone}</span></a></td>
            </tr>
            ${lead.wilayaName ? `<tr><th>الولاية</th><td>${lead.wilayaName}</td></tr>` : ''}
            ${lead.communeName ? `<tr><th>البلدية</th><td>${lead.communeName}</td></tr>` : ''}
            ${lead.deliveryType ? `<tr><th>التوصيل</th><td>${lead.deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل لباب المنزل'}</td></tr>` : ''}
            ${lead.addressDetails ? `<tr><th>العنوان التفصيلي</th><td>${lead.addressDetails}</td></tr>` : ''}
            ${lead.estimatedTotal ? `<tr><th>المبلغ التقديري</th><td style="color:#dc2626; font-weight:800;" dir="ltr">${lead.estimatedTotal} دج</td></tr>` : ''}
          </table>

          ${modelsHtml}

          <a href="tel:${lead.phone}" class="btn">📞 اضغط هنا للاتصال بالعميل وإتمام الطلب</a>
          <a href="https://wa.me/213${lead.phone.replace(/^0/, '')}" class="btn" style="background-color: #25D366; color: #ffffff; margin-top: 10px; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.2);">💬 تواصل معه عبر الواتساب</a>
        </div>
        
        <div class="footer">
          تم إرسال هذا البريد تلقائياً من نظام متجر Affaire DZ
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log('⚠️ [SMTP Notice] SMTP not configured. Abandoned lead payload logged:');
    console.log(JSON.stringify(lead, null, 2));
    return { success: true, simulated: true };
  }

  const mailOptions = {
    from: SENDER_EMAIL,
    to: ADMIN_EMAIL,
    subject: `⚠️ [طلب متروك] ${lead.fullName || 'بدون اسم'} - ${lead.wilayaName || ''} - ${lead.phone}`,
    html,
    attachments
  };

  return await transporter.sendMail(mailOptions);
}
