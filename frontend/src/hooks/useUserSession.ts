"use client";
import { useEffect, useState } from 'react';
import { getStoredSession, type UserSession } from '@/lib/auth';
import { refreshSession } from '@/lib/session-api';
import { apiError } from '@/lib/api';

export function useUserSession() {
  const [session, setSession] = useState<UserSession | null>(getStoredSession);
  const [isLoading, setIsLoading] = useState(!getStoredSession());
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    refreshSession()
      .then((s) => {
        if (active) setSession(s);
      })
      .catch((e) => {
        if (active) setError(apiError(e));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const changed = (e: Event) => setSession((e as CustomEvent<UserSession | null>).detail);
    window.addEventListener('codearena_session_updated', changed);
    return () => {
      active = false;
      window.removeEventListener('codearena_session_updated', changed);
    };
  }, []);

  return { session, isLoading, error };
}
