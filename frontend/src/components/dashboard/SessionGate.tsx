"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/hooks/useUserSession';
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading, error } = useUserSession();
  const router = useRouter();
  useEffect(() => { if (!isLoading && !session && !error) router.replace('/login'); }, [isLoading, session, error, router]);
  if (error) return <p role="alert" className="p-8 text-red-300">{error}</p>;
  if (isLoading || !session) return <p className="p-8">Checking your session…</p>;
  return children;
}
