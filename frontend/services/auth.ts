'use client';

export function saveSession(token: string, user: { id: string; name: string; email: string }) {
  localStorage.setItem('leadhunter_token', token);
  localStorage.setItem('leadhunter_user', JSON.stringify(user));
}

export function getSession(): { token: string | null; user: { id: string; name: string; email: string } | null } {
  if (typeof window === 'undefined') return { token: null, user: null };
  const token = localStorage.getItem('leadhunter_token');
  const raw = localStorage.getItem('leadhunter_user');
  const user = raw ? JSON.parse(raw) : null;
  return { token, user };
}

export function clearSession() {
  localStorage.removeItem('leadhunter_token');
  localStorage.removeItem('leadhunter_user');
}

export function isAuthenticated(): boolean {
  const { token } = getSession();
  if (!token) return false;
  try {
    // Verifica expiração sem biblioteca extra
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
