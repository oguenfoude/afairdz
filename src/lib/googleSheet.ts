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
 * Step 1: Store order directly into Google Sheet & Local CSV BEFORE sending email.
 * Returns the exact row number in Google Sheets so the email status can be updated immediately after delivery.
 */
export async function syncOrderToGoogleSheet(order: OrderData): Promise<{ success: boolean; rowNumber?: number }> {
  let rowNumber: number | undefined;

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
      order.totalPrice,
      `"⏳ قيد التأكيد"`,
      `"${(order.notes || '').replace(/"/g, '""')}"`,
      `"⏳ قيد الإرسال"`
    ].join(',');

    if (!fileExists) {
      const header = '"رقم الطلب","تاريخ الطلب","الاسم واللقب","رقم الهاتف","الولاية","البلدية","طريقة التوصيل","العنوان بالتفصيل","الموديل المختار","الكمية","سعر المنتج (دج)","سعر التوصيل (دج)","المجموع الإجمالي (دج)","حالة الطلب","ملاحظات","حالة إرسال الإيميل"\n';
      fs.writeFileSync(csvFile, '\uFEFF' + header + row + '\n', 'utf8');
    } else {
      fs.appendFileSync(csvFile, row + '\n', 'utf8');
    }
  } catch (err) {
    console.error('⚠️ [Local CSV Backup Error]', err);
  }

  // 2. Google Sheets API Sync (Columns A to P)
  try {
    const modelNames = order.selectedModels.map(m => m.modelName).join(' + ') || 'غير محدد';
    const formattedPhone = order.phone.startsWith('0') ? `'${order.phone}` : order.phone;

    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_SPREADSHEET_ID,
      range: 'الطلبات المؤكدة!A:P',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            order.orderId,
            order.createdAt,
            order.fullName,
            formattedPhone,
            `${order.wilayaName} (${order.wilayaId})`,
            order.communeName,
            order.deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل',
            order.addressDetails || '',
            modelNames,
            order.quantity,
            order.productPrice,
            order.deliveryFee,
            order.totalPrice,
            '⏳ قيد التأكيد',
            order.notes || '',
            '⏳ قيد الإرسال'
          ]
        ]
      }
    });

    const updatedRange = appendRes.data.updates?.updatedRange;
    const match = updatedRange ? updatedRange.match(/!A(\d+)/) : null;
    if (match) {
      rowNumber = parseInt(match[1], 10);
    }

    console.log(`✅ [Google Sheet] Order ${order.orderId} stored successfully at row ${rowNumber || 'unknown'}`);
    return { success: true, rowNumber };
  } catch (sheetErr) {
    console.error('⚠️ [Google Sheet Sync Error]', sheetErr);
    return { success: false, rowNumber: undefined };
  }
}

/**
 * Step 3: Update the order's email status in Google Sheet and Local CSV
 * Sets Column P to "✅ تم الإرسال" or "❌ فشل الإرسال"
 */
export async function updateOrderEmailStatus(
  orderId: string,
  status: '✅ تم الإرسال' | '❌ فشل الإرسال' | string,
  rowNumber?: number
): Promise<boolean> {
  let sheetUpdated = false;

  // 1. Direct update to Google Sheet cell P{rowNumber}
  if (rowNumber && rowNumber > 1) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_SPREADSHEET_ID,
        range: `الطلبات المؤكدة!P${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[status]]
        }
      });
      console.log(`✅ [Google Sheet] Order ${orderId} email marked as "${status}" at row ${rowNumber}`);
      sheetUpdated = true;
    } catch (directErr) {
      console.error(`⚠️ [Google Sheet Direct Update Error at row ${rowNumber}]:`, directErr);
    }
  }

  // Fallback: search Column A for orderId if direct update didn't run or failed
  if (!sheetUpdated) {
    try {
      const colARes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_SPREADSHEET_ID,
        range: 'الطلبات المؤكدة!A:A'
      });
      const rows = colARes.data.values || [];
      const foundIdx = rows.findIndex(r => r && r[0] === orderId);
      if (foundIdx !== -1) {
        const targetRow = foundIdx + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_SPREADSHEET_ID,
          range: `الطلبات المؤكدة!P${targetRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[status]]
          }
        });
        console.log(`✅ [Google Sheet Fallback] Order ${orderId} email marked as "${status}" at row ${targetRow}`);
        sheetUpdated = true;
      }
    } catch (searchErr) {
      console.error('⚠️ [Google Sheet Search Update Error]:', searchErr);
    }
  }

  // 2. Update Local CSV Backup
  try {
    const csvFile = path.join(process.cwd(), 'data', 'orders.csv');
    if (fs.existsSync(csvFile)) {
      const content = fs.readFileSync(csvFile, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      const updatedLines = lines.map(line => {
        if (line.includes(`"${orderId}"`)) {
          modified = true;
          const parts = line.split(',');
          if (parts.length >= 16) {
            parts[15] = `"${status}"`;
            return parts.join(',');
          } else {
            return `${line},"${status}"`;
          }
        }
        return line;
      });

      if (modified) {
        fs.writeFileSync(csvFile, updatedLines.join('\n'), 'utf8');
        console.log(`✅ [Local CSV] Order ${orderId} updated to "${status}"`);
      }
    }
  } catch (csvErr) {
    console.error('⚠️ [Local CSV Update Error]:', csvErr);
  }

  return sheetUpdated;
}

/**
 * Sync Abandoned Cart Lead directly to Google Sheets tab "السلات المتروكة"
 */
export async function syncLeadToGoogleSheet(lead: AbandonedLeadData): Promise<void> {
  try {
    const modelNames = (lead.selectedModels || []).map(m => m.modelName).join(' + ') || 'غير محدد';
    const formattedPhone = lead.phone.startsWith('0') ? `'${lead.phone}` : lead.phone;

    const stageMap: Record<string, string> = {
      idle_timeout: 'توقف في الاستمارة',
      page_leave: 'خروج من الصفحة',
      tab_hidden: 'تصغير المتصفح'
    };
    const stageName = stageMap[lead.stage] || lead.stage;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_SPREADSHEET_ID,
      range: 'السلات المتروكة!A:P',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            lead.leadId,
            lead.abandonedAt,
            lead.fullName,
            formattedPhone,
            lead.wilayaName || '---',
            lead.communeName || '---',
            lead.deliveryType === 'desk' ? 'استلام من المكتب' : 'توصيل للمنزل',
            lead.addressDetails || '---',
            modelNames,
            1,
            1500,
            lead.deliveryType === 'desk' ? 500 : 700,
            lead.estimatedTotal || 2200,
            stageName,
            '⏳ متروك (جديد)',
            'استمارة مكتملة - خرج دون ضغط تأكيد الطلب'
          ]
        ]
      }
    });
    console.log(`✅ [Google Sheet] Abandoned lead ${lead.leadId} synced to "السلات المتروكة"`);
  } catch (sheetErr) {
    console.error('⚠️ [Google Sheet Lead Sync Error]:', sheetErr);
  }
}
