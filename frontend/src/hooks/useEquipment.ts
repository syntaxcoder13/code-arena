"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export function useEquipment() {
  const [settings, setSettings] = useState({ editorTheme: 'vs-dark', title: 'Cadet Coder', bannerTheme: 'acid-grid', soundPack: 'arcade', avatarFrame: 'classic', victoryEffect: 'spark' });
  useEffect(() => {
    let active = true;
    const sync = () => { api.get('/api/codearena/settings').then(r => { if (active) setSettings(prev => ({ ...prev, ...r.data })); }).catch(() => {}); };
    sync(); window.addEventListener('codearena_equipment_updated', sync);
    return () => { active = false; window.removeEventListener('codearena_equipment_updated', sync); };
  }, []);
  return settings;
}
