const STORAGE_KEY = 'admin_pw';

export function getAdminPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminPassword(pw: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, pw);
}

export function clearAdminPassword() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
}

export async function adminFetch(input: RequestInfo, init: RequestInit = {}) {
  const pw = getAdminPassword();
  if (!pw) throw new Error('Not logged in');
  
  const headers = new Headers(init.headers);
  headers.set('x-admin-password', pw);
  headers.set('Content-Type', 'application/json');
  
  const res = await fetch(input, { ...init, headers });
  
  if (res.status === 401) {
    clearAdminPassword();
    window.location.href = '/admin/login';
    throw new Error('Session expired');
  }
  return res;
}