export interface UserSession {
  id: string;
  name: string;
  username: string;
  handle: string;
  email?: string;
  avatarUrl?: string;
  provider?: "google" | "github" | "email" | "guest";
}

const STORAGE_KEY = "codearena_auth_session";
const TOKEN_KEY = "codearena_jwt_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent("codearena_session_updated", { detail: session }));
  } catch (e) {
    console.error("Failed to save auth session", e);
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("codearena_session_updated", { detail: null }));
  } catch (e) {
    console.error("Failed to clear auth session", e);
  }
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return "DEV";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
