"use client";
import { useCallback, useEffect, useState } from 'react';
import { api, apiError } from '@/lib/api';
export const field = 'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white';
export const action = 'rounded-xl bg-[#E5FF45] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-40 hover:brightness-110';
export const secondary = 'rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 disabled:opacity-40 hover:bg-zinc-800';
export const card = 'rounded-2xl border border-zinc-800 bg-[#0C0E14]/90 p-5 space-y-4';
export function FeatureHeading({ title, description }: { title: string; description: string }) { return <header className="space-y-2 border-b border-zinc-800 pb-5"><p className="text-xs tracking-widest text-[#E5FF45] font-mono">CODE ARENA</p><h1 className="text-3xl font-bold">{title}</h1><p className="text-sm text-zinc-400">{description}</p></header>; }
export function useFeature<T>(path: string, interval = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { const r = await api.get<T>(path); setData(r.data); return r.data; }, [path]);
  useEffect(() => { let active = true; const load = () => api.get<T>(path).then(r => { if (active) setData(r.data); }).catch(e => { if (active) setError(apiError(e)); }); void load(); const timer = interval ? setInterval(load, interval) : null; return () => { active = false; if (timer) clearInterval(timer); }; }, [path, interval]);
  const mutate = async (url: string, body?: unknown) => {
    if (busy) return false;
    setBusy(true); setError('');
    try { await api.post(url, body); await refresh(); return true; }
    catch (e) { setError(apiError(e)); return false; }
    finally { setBusy(false); }
  };
  return { data, error, busy, mutate, refresh };
}
export function FeatureStatus({ error, loading }: { error: string; loading: boolean }) { return <>{error && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-300">{error}</p>}{loading && !error && <p className="text-zinc-400">Loading…</p>}</>; }
