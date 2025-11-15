// lib/cookies.ts
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days: number, options: { secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' } = {}) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = options.secure ? '; secure' : '';
  const sameSite = options.sameSite ? `; sameSite=${options.sameSite}` : '; sameSite=lax';
  document.cookie = `${name}=${value}; expires=${expires}; path=/; max-age=${days * 86400}${secure}${sameSite}`;
}

export function deleteCookie(name: string, options: { secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' } = {}) {
  setCookie(name, '', -1, options); // Set expires in past to delete
}