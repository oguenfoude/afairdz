import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { OrderData, AbandonedLeadData } from './mailer';

const SHEET_SPREADSHEET_ID = '13dbk2BahMTNl7fZgrjpwKMru8XvPnhpSX-AqTsysYkk';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: "acount@rplus-database.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDI2MwJ35XsAf9\nSAE89pFeNUWT9vgfth6eSrXO9NRjJ5117n2hq++uH8EzzUIAwYaVUBBGS5ALj5Rg\n+SOTs3HgnfstNvJnerbwAAh8EsUH1P2OVg94dyc7FAo7jyfHow77X6S739UJBcyU\ndeBvJOpsJzXMQ3kM+X5QCbabJnw9ljC2aaPw5FGyr4JmcZOAkR6+vv8lzHpaZP1o\ncOVW7bQYkPgn9Q+UyWzHniQvh7E/PNDKX6i+YXBxIdHV17pLNKqry+fy7E+xQM5C\nhCnW9K/LFmOoP7RPU2NqxfmRz8Kw4O9g6oy78OeWrEB8zyWkq/YYEbmXCw884SFQ\nQEH7TCL9AgMBAAECggEAHStahdW5fJkbMKDFUpwW8cqrymj2ASODoyzOzY9qeiHv\nVzQdwn+FlfU4N6qcjalgGUy9Cgz8jMXbK73CNC90O9vRspoOlSpSU0DmA8n4eum7\nNz4lFOBW1G1z9CA7lYuJz0imQtE8MpuTz7NpJ6QQiLc5wv1pCGf5GjTBf6K6mqfo\nVJ1TJ9p1D5MCaOjJinLMR4rEWT+Uh1yA4RNj84N30mjrh0ziflDy0ciW4l1VtBrr\nWLn8ZYlCNOn748sR3Qo1N0EPEEA7EW0kiTB2wA2WBOxAl0x+W/KoC9VRB6F6ujt4\nrB/9kph5gF5HshwYYYHt3M39nI2/ZdCuFAidH7uzLwKBgQDsxfopsDeycCSbwaM/\n0geVcjYTNVxv05foErsH21WAlczfewOGqLcQWC3+jpOkjbul7c1pQJvyFtN1NRwi\nde34Y1rLUXkQzb/yzeA8UofFDFbP1AlY0C+r6zn+ksoq3Zr9zbUF2UhZSmTvbQt6\nx+nBQqmO3qPkHmyQSmm7a8ZhXwKBgQDS++c7gW0IXHNN6y/QE3MH6WBoPBCdGewV\nGPkdVptrcvaIR1UTgb42k82GR0AQrhdVwMwt0ARmRI853YeI1KJSIc/YJOyvTbKI\n5YrvMHSLqhWGRz4CiFMN/qRuKQqgjDqQ1SlUzTP3ZBp5C8w50EXIhjs/n+UjUSYi\nfit51qUNIwKBgC44AzpKDMVHQM4qwWw+2n4guk+Llgy6OCf0KBBDj3A3TbO+NpT9\nsCZ/oBLV0BpKFHwybGuEUiyyqfpyMJjFfnuDIYEY2VIfZ73E1GXSEnCzlOqi0GRG\n11du5nY8PzyY3511n0WSAZ50eDmIhroj9gxkr+aUrVdlXPnZnMQaKLJvAoGBAMmf\nSyF1lOGpn9L1jzKUc5g68ROLWwEW9aJPxDjCPDJZobkoGehTU5hKdNz+l/2YsNoV\nLcoWAS5OFGVjC5O6SAifIUXYO4tnf9cNLVFZB/c0Ke+xg1PePSihkTdo5yv39jvU\nSPQuSZwAQMAugxM4sodnp5Us00eF1CCgXCHJ+t7rAoGADGmkwBJlpDXDbcD/fXZ1\npnSI8zm7oq1ep6Op76q8NKw68t4wZBQoqzrAc2THKc87TuOsWluSXHWN/GHUNmdQ\njAhFLDaFLlMJiCgz5A3mUSrMq/2D8v8wStH7787vWxnZBKCDbBatMNmQn1qkw46M\nYXsVlUUvUDYxlFg7O/ed9FY=\n-----END PRIVATE KEY-----\n"
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

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

  // 2. Google Sheets API Sync
  try {
    const modelNames = order.selectedModels.map(m => m.modelName).join(' + ') || 'غير محدد';
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_SPREADSHEET_ID,
      range: 'A:Z', // Appends to the first sheet
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            order.orderId,
            order.createdAt,
            order.fullName,
            order.phone,
            `${order.wilayaName} (${order.wilayaId})`,
            order.communeName,
            order.deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل',
            order.addressDetails || '',
            modelNames,
            order.quantity,
            order.productPrice,
            order.deliveryFee,
            order.totalPrice,
            order.notes || ''
          ]
        ]
      }
    });
    console.log('✅ [Google Sheet] Order synced to spreadsheet successfully');
  } catch (webhookErr) {
    console.error('⚠️ [Google Sheet Sync Error]', webhookErr);
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

    const modelNames = lead.selectedModels && lead.selectedModels.length > 0 ? lead.selectedModels.map(m => m.modelName).join(' + ') : 'غير محدد';

    const row = [
      `"${lead.leadId}"`,
      `"${lead.abandonedAt}"`,
      `"${lead.fullName || 'غير محدد'}"`,
      `"${lead.phone}"`,
      `"${lead.wilayaName || ''}"`,
      `"${lead.communeName || ''}"`,
      `"${lead.addressDetails || ''}"`,
      `"${lead.deliveryType || ''}"`,
      lead.estimatedTotal || 0,
      `"${modelNames}"`,
      `"${lead.stage}"`
    ].join(',');

    if (!fileExists) {
      const header = 'رقم المعرف,تاريخ التوقف,الاسم,رقم الهاتف,الولاية,البلدية,العنوان,طريقة التوصيل,المبلغ التقديري,الموديل المختار,المرحلة\n';
      fs.writeFileSync(csvFile, '\uFEFF' + header + row + '\n', 'utf8');
    } else {
      fs.appendFileSync(csvFile, row + '\n', 'utf8');
    }
  } catch (err) {
    console.error('⚠️ [Local Leads CSV Error]', err);
  }

  // 2. Google Sheets API Sync (Abandoned Leads)
  try {
    const modelNames = lead.selectedModels && lead.selectedModels.length > 0 ? lead.selectedModels.map(m => m.modelName).join(' + ') : 'غير محدد';
    
    // First try to push to the 'Abandoned' tab if the user created it
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_SPREADSHEET_ID,
        range: 'Abandoned!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              lead.leadId,
              lead.abandonedAt,
              lead.fullName || 'غير محدد',
              lead.phone,
              lead.wilayaName || '',
              lead.communeName || '',
              lead.addressDetails || '',
              lead.deliveryType === 'desk' ? 'استلام من المكتب' : (lead.deliveryType === 'domicile' ? 'توصيل للمنزل' : ''),
              lead.estimatedTotal || 0,
              modelNames,
              lead.stage
            ]
          ]
        }
      });
      console.log('✅ [Google Sheet] Abandoned Lead synced to Abandoned tab');
    } catch {
      // If the 'Abandoned' tab doesn't exist, gracefully fall back to the main sheet
      // Aligning exactly with the 14 columns of a real order to prevent mess
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_SPREADSHEET_ID,
        range: 'A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              lead.leadId,
              lead.abandonedAt,
              `[متروك] ${lead.fullName || 'بدون اسم'}`,
              lead.phone,
              lead.wilayaName || '',
              lead.communeName || '',
              lead.deliveryType === 'desk' ? 'استلام من المكتب' : (lead.deliveryType === 'domicile' ? 'توصيل للمنزل' : ''),
              lead.addressDetails || '---',
              modelNames,
              1,
              '',
              '',
              lead.estimatedTotal || 0,
              `لم يكمل الطلب (مرحلة: ${lead.stage})`
            ]
          ]
        }
      });
      console.log('✅ [Google Sheet] Abandoned Lead safely synced to main tab');
    }
  } catch (err) {
    console.error('⚠️ [Google Sheet Leads Sync Error]', err);
  }
}
