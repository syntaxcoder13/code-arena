import { api } from './api';
import { clearSession, saveSession, type UserSession } from './auth';
export async function startGithubLogin() {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem('codearena_pkce', verifier);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL('/api/auth/github', api.defaults.baseURL);
  url.search = new URLSearchParams({ redirect: location.origin, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
  location.assign(url.toString());
}
let pending: Promise<UserSession | null> | null = null;
export function refreshSession(): Promise<UserSession | null> {
  if (pending) return pending;
  pending = (async () => {
    const url = new URL(location.href);
    const code = url.searchParams.get('code');
    if (code) {
      const codeVerifier = sessionStorage.getItem('codearena_pkce');
      if (!codeVerifier) throw new Error('Login must finish in the tab where it started.');
      await api.post('/api/auth/exchange', { code, codeVerifier });
      sessionStorage.removeItem('codearena_pkce');
      url.searchParams.delete('code'); url.searchParams.delete('onboarding');
      history.replaceState(null, '', url.pathname + url.search);
    }
    const { data } = await api.get('/api/auth/me');
    if (!data.authenticated) { clearSession(); return null; }
    const session: UserSession = { ...data.user, handle: `@${data.user.username}`, provider: 'github' };
    saveSession(session); return session;
  })().finally(() => { pending = null; });
  return pending;
}
export async function logout() { await api.post('/api/auth/logout'); clearSession(); }
