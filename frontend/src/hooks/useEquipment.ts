"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getStoredSession } from '@/lib/auth';

export function useEquipment() {
  const [settings, setSettings] = useState({
    editorTheme: 'vs-dark',
    title: 'Cadet Coder',
    bannerTheme: 'acid-grid',
    soundPack: 'arcade',
    avatarFrame: 'classic',
    victoryEffect: 'spark',
  });

  useEffect(() => {
    let active = true;

    const sync = () => {
      // Avoid querying protected settings if the user is not logged in yet
      if (!getStoredSession()) return;
      api
        .get('/api/codearena/settings')
        .then((r) => {
          if (active && r.data) {
            setSettings((prev) => ({ ...prev, ...r.data }));
          }
        })
        .catch(() => {});
    };

    sync();
    window.addEventListener('codearena_equipment_updated', sync);
    window.addEventListener('codearena_session_updated', sync);

    return () => {
      active = false;
      window.removeEventListener('codearena_equipment_updated', sync);
      window.removeEventListener('codearena_session_updated', sync);
    };
  }, []);

  return settings;
}
