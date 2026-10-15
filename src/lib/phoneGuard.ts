import { getBlobJson, putBlobJson } from './blob';

const HISTORY_KEY = 'phone-history.json';

export interface PhoneRecord {
  orderId: string;
  at: number;
  blockedAt?: number;
  reason?: string;
}

export type PhoneHistory = Record<string, PhoneRecord>;

const EMPTY: PhoneHistory = {};

export async function getPhoneHistory(): Promise<PhoneHistory> {
  return getBlobJson<PhoneHistory>(HISTORY_KEY, EMPTY);
}

async function savePhoneHistory(h: PhoneHistory) {
  await putBlobJson(HISTORY_KEY, h);
}

export function isBlocked(rec: PhoneRecord | undefined): boolean {
  return Boolean(rec?.blockedAt);
}

/** Record a successful first order (best-effort: never throws) */
export async function recordOrderPhone(phone: string, orderId: string) {
  try {
    const h = await getPhoneHistory();
    if (!h[phone]) {
      h[phone] = { orderId, at: Date.now() };
      await savePhoneHistory(h);
    }
  } catch { /* never break ordering */ }
}

/**
 * Permanently block a phone (repeat order attempt). Best-effort, never throws.
 * Returns the record for logging.
 */
export async function blockPhone(phone: string, orderId: string, reason: string): Promise<PhoneRecord> {
  const rec: PhoneRecord = { orderId, at: Date.now(), blockedAt: Date.now(), reason };
  try {
    const h = await getPhoneHistory();
    const prev = h[phone];
    h[phone] = { orderId: prev?.orderId ?? orderId, at: prev?.at ?? Date.now(), blockedAt: Date.now(), reason };
    await savePhoneHistory(h);
    return h[phone];
  } catch {
    return rec;
  }
}

export async function unblockPhone(phone: string): Promise<boolean> {
  try {
    const h = await getPhoneHistory();
    if (!h[phone]?.blockedAt) return false;
    delete h[phone].blockedAt;
    delete h[phone].reason;
    await savePhoneHistory(h);
    return true;
  } catch {
    return false;
  }
}

export async function listBlocked(): Promise<{ phone: string; orderId: string; at: number; blockedAt: number; reason?: string }[]> {
  try {
    const h = await getPhoneHistory();
    return Object.entries(h)
      .filter(([, r]) => r.blockedAt)
      .map(([phone, r]) => ({ phone, orderId: r.orderId, at: r.at, blockedAt: r.blockedAt!, reason: r.reason }))
      .sort((a, b) => b.blockedAt - a.blockedAt);
  } catch {
    return [];
  }
}

export const BLOCKED_MESSAGE =
  '🚫 تم حظر هذا الرقم نهائياً بسبب تكرار الطلبات — لا يمكن إتمام أي طلب جديد بهذا الرقم.';
