"use client";
import { useEffect, useState } from 'react';
import { loadSummary, type ArenaSummary } from '@/lib/codearena';
import { apiError } from '@/lib/api';
let pending: Promise<ArenaSummary> | null = null;
export function useArenaSummary() {
  const [summary, setSummary] = useState<ArenaSummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!pending) pending = loadSummary().finally(() => { pending = null; });
    pending.then(s => { if (active) setSummary(s); }).catch(e => { if (active) setError(apiError(e)); });
    return () => { active = false; };
  }, []);
  return { summary, error };
}
