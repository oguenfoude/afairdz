import nodemailer, { Transporter } from 'nodemailer';
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

let cachedTransporter: Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GOOGLE_EMAIL || process.env.SMTP_USER || 'oguenfoude@gmail.com';
  const pass = process.env.GOOGLE_APP_PASSWORD || process.env.SMTP_PASS || 'qffh illr yauh duwb';

  // For Gmail (default), service: 'gmail' is natively optimized for serverless environments (handles TLS/ports/DNS automatically)
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('gmail.com')) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });
    return cachedTransporter;
  }

  // Custom SMTP host if explicitly defined in env
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: { rejectUnauthorized: false }
  });

  return cachedTransporter;
}

// Single admin recipient: kalijeogo@gmail.com strictly as requested
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kalijeogo@gmail.com';
const SENDER_EMAIL = process.env.EMAIL_FROM || '"Affaire DZ" <oguenfoude@gmail.com>';

export async function sendOrderNotification(order: OrderData) {
  const deliveryTypeLabel = order.deliveryType === 'desk' ? 'استلام من المكتب (500 دج)' : 'توصيل لباب المنزل (700 دج)';
  const attachments: Array<{ filename: string; path: string; cid?: string }> = [];

  // 1. Attach Brand Logo if exists
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'brand_logo'
      });
    }
  } catch (e) {
    console.warn('⚠️ Could not attach logo:', e);
  }

  // 2. Attach Selected Watch Model Images for Gmail display with hosted fallback
  const modelsHtml = order.selectedModels.map((m, idx) => {
    let imgHtml = '';
    try {
      if (m.image) {
        const cleanImgRel = m.image.replace(/^\//, '');
        const fullImgPath = path.join(process.cwd(), 'public', cleanImgRel);
        const cidKey = `model_image_${idx}`;
        const hostedImgUrl = `https://afairdz.vercel.app/${cleanImgRel}`;

        if (fs.existsSync(fullImgPath)) {
          attachments.push({
            filename: `${m.modelName.replace(/[\s\/]/g, '_')}_${m.modelId}.webp`,
            path: fullImgPath,
            cid: cidKey
          });
          imgHtml = `<img src="cid:${cidKey}" alt="${m.modelName}" width="90" height="90" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />`;
        } else {
          imgHtml = `<img src="${hostedImgUrl}" alt="${m.modelName}" width="90" height="90" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />`;
        }
      }
    } catch (imgErr) {
      console.warn('⚠️ Could not attach model image:', imgErr);
    }

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; width: 100px; text-align: center; vertical-align: middle;">
          ${imgHtml || '<span style="font-size: 11px; color: #94a3b8;">صورة الموديل</span>'}
        </td>
        <td style="padding: 12px; text-align: right; vertical-align: middle;">
          <div style="font-size: 16px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px;">${m.modelName}</div>
          <div style="font-size: 13px; color: #64748b;">طقم ساعة رجالية فاخرة + خاتم وبراسلي مجاناً داخل علبة إهداء</div>
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
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .badge { background-color: #10b981; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin-top: 10px; }
        .content { padding: 30px; }
        .section-title { font-size: 18px; color: #1e1b4b; font-weight: 700; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .info-table th { width: 35%; padding: 12px 15px; background-color: #f8fafc; color: #475569; font-weight: 600; text-align: right; border: 1px solid #e2e8f0; font-size: 14px; }
        .info-table td { padding: 12px 15px; border: 1px solid #e2e8f0; font-size: 15px; color: #1e293b; font-weight: 500; }
        .phone-link { color: #dc2626; font-weight: 700; text-decoration: none; font-size: 16px; display: inline-flex; align-items: center; gap: 5px; }
        .summary-box { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; padding: 20px; margin-top: 10px; border: 1px solid #cbd5e1; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px; color: #475569; }
        .summary-row.total { font-size: 22px; font-weight: 800; color: #1e1b4b; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #cbd5e1; margin-bottom: 0; }
        .footer { text-align: center; padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
        .btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #2563eb; color: #ffffff; padding: 16px 20px; text-decoration: none; font-size: 18px; font-weight: 700; border-radius: 8px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color:white; margin:0; margin-bottom: 10px; font-size: 28px;">Affaire DZ</h2>
          <h1>طلب شراء جديد مؤكد ✅</h1>
          <div class="badge">رقم الطلب: ${order.orderId}</div>
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
            ${order.phone2 ? `<tr><th>رقم هاتف إضافي</th><td><a href="tel:${order.phone2}" class="phone-link">📞 <span dir="ltr">${order.phone2}</span></a></td></tr>` : ''}
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

          <a href="tel:${order.phone}" class="btn">📞 الاتصال بالزبون الآن للتأكيد (${order.phone})</a>
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
  const mailOptions = {
    from: SENDER_EMAIL,
    to: ADMIN_EMAIL,
    subject: `✅ [Affaire DZ] طلب جديد: ${order.fullName} - ${order.wilayaName} (${order.totalPrice} دج)`,
    html,
    attachments
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Dispatch Abandoned Cart Alert directly to kalijeogo@gmail.com
 * Internal only - zero ads pixel events fired
 */
export async function sendAbandonedLeadNotification(lead: AbandonedLeadData) {
  const stageLabels: Record<string, string> = {
    idle_timeout: 'توقف عن ملء الاستمارة (أكثر من 60 ثانية)',
    page_leave: 'غادر الصفحة قبل النقر على تأكيد الطلب',
    tab_hidden: 'قام بالخروج أو تصغير المتصفح'
  };
  const stageLabel = stageLabels[lead.stage] || 'لم يكمل الطلب';

  const attachments: Array<{ filename: string; path: string; cid?: string }> = [];

  const modelsHtml = (lead.selectedModels || []).map((m, idx) => {
    let imgHtml = '';
    try {
      if (m.image) {
        const cleanImgRel = m.image.replace(/^\//, '');
        const fullImgPath = path.join(process.cwd(), 'public', cleanImgRel);
        const cidKey = `lead_model_image_${idx}`;
        const hostedImgUrl = `https://afairdz.vercel.app/${cleanImgRel}`;

        if (fs.existsSync(fullImgPath)) {
          attachments.push({
            filename: `${m.modelName.replace(/[\s\/]/g, '_')}_${m.modelId}.webp`,
            path: fullImgPath,
            cid: cidKey
          });
          imgHtml = `<img src="cid:${cidKey}" alt="${m.modelName}" width="90" height="90" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />`;
        } else {
          imgHtml = `<img src="${hostedImgUrl}" alt="${m.modelName}" width="90" height="90" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />`;
        }
      }
    } catch (imgErr) {
      console.warn('⚠️ Could not attach lead model image:', imgErr);
    }

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; width: 100px; text-align: center; vertical-align: middle;">
          ${imgHtml || '<span style="font-size: 11px; color: #94a3b8;">صورة الموديل</span>'}
        </td>
        <td style="padding: 12px; text-align: right; vertical-align: middle;">
          <div style="font-size: 16px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px;">${m.modelName}</div>
          <div style="font-size: 13px; color: #64748b;">طقم ساعة رجالية فاخرة + خاتم وبراسلي مجاناً</div>
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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; background-color: #fef2f2; margin: 0; padding: 40px 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #991b1b; padding: 25px 20px; text-align: center; border-bottom: 4px solid #f59e0b; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
        .badge { background-color: #fef08a; color: #854d0e; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block; margin-top: 10px; }
        .content { padding: 30px; }
        .section-title { font-size: 17px; color: #991b1b; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #fee2e2; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table th { width: 35%; padding: 10px 14px; background-color: #fff1f2; color: #881337; font-weight: 600; text-align: right; border: 1px solid #fecdd3; font-size: 14px; }
        .info-table td { padding: 10px 14px; border: 1px solid #fecdd3; font-size: 15px; color: #1e293b; font-weight: 600; }
        .phone-link { color: #dc2626; font-weight: 800; text-decoration: none; font-size: 17px; }
        .btn { display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #dc2626; color: #ffffff; padding: 16px 20px; text-decoration: none; font-size: 18px; font-weight: 800; border-radius: 8px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.25); }
        .footer { text-align: center; padding: 15px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color:white; margin:0; margin-bottom: 8px; font-size: 24px;">Affaire DZ</h2>
          <h1>⚠️ تنبيه سلة متروكة (زبون لم يكمل الطلب)</h1>
          <div class="badge">المعرف: ${lead.leadId}</div>
        </div>
        
        <div class="content">
          <div style="text-align: center; color: #64748b; font-size: 13px; margin-bottom: 20px;">
            توقيت المحاولة: <span dir="ltr">${lead.abandonedAt}</span>
          </div>

          <div class="section-title">👤 بيانات الزبون المستهدَف للاسترجاع</div>
          <table class="info-table">
            <tr>
              <th>الاسم واللقب</th>
              <td>${lead.fullName}</td>
            </tr>
            <tr>
              <th>رقم الهاتف</th>
              <td><a href="tel:${lead.phone}" class="phone-link">📞 <span dir="ltr">${lead.phone}</span></a></td>
            </tr>
            <tr>
              <th>الولاية</th>
              <td>${lead.wilayaName || 'غير محدد'}</td>
            </tr>
            <tr>
              <th>البلدية</th>
              <td>${lead.communeName || 'غير محدد'}</td>
            </tr>
            <tr>
              <th>طريقة الاستلام</th>
              <td>${lead.deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل'}</td>
            </tr>
            <tr>
              <th>العنوان بالتفصيل</th>
              <td>${lead.addressDetails || '---'}</td>
            </tr>
            <tr>
              <th>سبب التوقف</th>
              <td style="color: #b91c1c;">${stageLabel}</td>
            </tr>
            <tr>
              <th>المبلغ التقديري</th>
              <td style="color: #1e1b4b;">${lead.estimatedTotal || 2200} دج</td>
            </tr>
          </table>

          <div class="section-title">📦 الموديل الذي كان يختاره</div>
          <table class="items-table">
            ${modelsHtml}
          </table>

          <a href="tel:${lead.phone}" class="btn">📞 الاتصال بالزبون الآن لاسترجاع الطلب (${lead.phone})</a>
        </div>
        
        <div class="footer">
          إشعار آلي داخلي خاص بإدارة متجر Affaire DZ • غير مرتبط بإعلانات ميتا نهائياً
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();
  return await transporter.sendMail({
    from: SENDER_EMAIL,
    to: ADMIN_EMAIL,
    subject: `⚠️ [سلة متروكة] زبون لم يكمل الطلب: ${lead.fullName} (${lead.phone})`,
    html,
    attachments
  });
}
