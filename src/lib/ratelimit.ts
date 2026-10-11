const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return { allowed: true };
  }
  
  if (record.count >= 5) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}