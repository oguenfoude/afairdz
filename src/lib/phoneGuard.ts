export interface PhoneRecord {
  orderId: string;
  at: number;
  blockedAt?: number;
  reason?: string;
}

export type PhoneHistory = Record<string, PhoneRecord>;

const history: PhoneHistory = {};

export async function getPhoneHistory(): Promise<PhoneHistory> {
  return { ...history };
}

export function isBlocked(rec: PhoneRecord | undefined): boolean {
  return Boolean(rec?.blockedAt);
}

export async function recordOrderPhone(phone: string, orderId: string) {
  if (!history[phone]) history[phone] = { orderId, at: Date.now() };
}

export async function blockPhone(phone: string, orderId: string, reason: string): Promise<PhoneRecord> {
  const prev = history[phone];
  const rec: PhoneRecord = {
    orderId: prev?.orderId ?? orderId,
    at: prev?.at ?? Date.now(),
    blockedAt: Date.now(),
    reason,
  };
  history[phone] = rec;
  return rec;
}

export async function unblockPhone(phone: string): Promise<boolean> {
  const rec = history[phone];
  if (!rec?.blockedAt) return false;
  delete rec.blockedAt;
  delete rec.reason;
  return true;
}

export async function listBlocked(): Promise<{ phone: string; orderId: string; at: number; blockedAt: number; reason?: string }[]> {
  return Object.entries(history)
    .filter(([, r]) => r.blockedAt)
    .map(([phone, r]) => ({ phone, orderId: r.orderId, at: r.at, blockedAt: r.blockedAt!, reason: r.reason }))
    .sort((a, b) => b.blockedAt - a.blockedAt);
}

export const BLOCKED_MESSAGE =
  '🚫 تم حظر هذا الرقم نهائياً بسبب تكرار الطلبات — لا يمكن إتمام أي طلب جديد بهذا الرقم.';
