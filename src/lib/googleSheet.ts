import fs from 'fs';
import path from 'path';
import { OrderData, AbandonedLeadData } from './mailer';

/**
 * Google Sheets and Local CSV Data Sync for Affaire DZ
 */
export async function syncOrderToGoogleSheet(order: OrderData): Promise<void> {
  // 1. Local CSV Backup to ensure zero data loss
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const csvFile = path.join(dataDir, 'orders.csv');
    const fileExists = fs.existsSync(csvFile);

    const modelNames = order.selectedModels.map(m => m.modelName).join(' + ') || 'غير محدد';
    const row = [
      `"${order.orderId}"`,
      `"${order.createdAt}"`,
      `"${order.fullName}"`,
      `"${order.phone}"`,
      `"${order.wilayaName} (${order.wilayaId})"`,
      `"${order.communeName}"`,
      `"${order.deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل'}"`,
      `"${(order.addressDetails || '').replace(/"/g, '""')}"`,
      `"${modelNames}"`,
      order.quantity,
      order.productPrice,
      order.deliveryFee,
      order.totalPrice
    ].join(',');

    if (!fileExists) {
      const header = 'رقم الطلب,تاريخ الطلب,الاسم واللقب,رقم الهاتف,الولاية,البلدية,طريقة التوصيل,العنوان بالتفصيل,الموديل المختار,الكمية,سعر المنتوج,سعر التوصيل,المجموع الإجمالي\n';
      fs.writeFileSync(csvFile, '\uFEFF' + header + row + '\n', 'utf8');
    } else {
      fs.appendFileSync(csvFile, row + '\n', 'utf8');
    }
  } catch (err) {
    console.error('⚠️ [Local CSV Error]', err);
  }

  // 2. Google Sheets Webhook Sync (Google Apps Script Webhook)
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (webhookUrl && !webhookUrl.includes('YOUR_GOOGLE_SHEET_WEBHOOK')) {
    try {
      const payload = {
        action: 'new_order',
        orderId: order.orderId,
        date: order.createdAt,
        name: order.fullName,
        phone: order.phone,
        phone2: order.phone2 || '',
        wilaya: `${order.wilayaName} (${order.wilayaId})`,
        commune: order.communeName,
        deliveryType: order.deliveryType === 'desk' ? 'استلام من المكتب (500 دج)' : 'توصيل للمنزل (700 دج)',
        address: order.addressDetails || '',
        models: order.selectedModels.map(m => m.modelName).join(', '),
        quantity: order.quantity,
        productPrice: order.productPrice,
        deliveryFee: order.deliveryFee,
        totalPrice: order.totalPrice,
        notes: order.notes || ''
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (webhookErr) {
      console.error('⚠️ [Google Sheet Sync Error]', webhookErr);
    }
  }
}

export async function syncLeadToGoogleSheet(lead: AbandonedLeadData): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const csvFile = path.join(dataDir, 'abandoned_leads.csv');
    const fileExists = fs.existsSync(csvFile);

    const row = [
      `"${lead.leadId}"`,
      `"${lead.abandonedAt}"`,
      `"${lead.fullName || 'غير محدد'}"`,
      `"${lead.phone}"`,
      `"${lead.wilayaName || ''}"`,
      `"${lead.communeName || ''}"`,
      `"${lead.deliveryType || ''}"`,
      lead.estimatedTotal || 0,
      `"${lead.stage}"`
    ].join(',');

    if (!fileExists) {
      const header = 'رقم المعرف,تاريخ التوقف,الاسم,رقم الهاتف,الولاية,البلدية,طريقة التوصيل,المبلغ التقديري,المرحلة\n';
      fs.writeFileSync(csvFile, '\uFEFF' + header + row + '\n', 'utf8');
    } else {
      fs.appendFileSync(csvFile, row + '\n', 'utf8');
    }
  } catch (err) {
    console.error('⚠️ [Local Leads CSV Error]', err);
  }
}
