"use client";
import { useEquipment } from '@/hooks/useEquipment';
export function VictoryCelebration() {
  const equipment = useEquipment();
  return <div aria-hidden="true" className="pointer-events-none relative h-24 overflow-hidden rounded-xl bg-[#E5FF45]/5 flex items-center justify-center"><span className="text-3xl text-[#E5FF45]">✦ VICTORY ✦</span>{equipment.victoryEffect === 'confetti' && Array.from({ length: 18 }, (_,i) => <span key={i} className="absolute h-2 w-2 motion-safe:animate-bounce" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 90}%`, backgroundColor: ['#E5FF45','#00F0FF','#C4B5FD','#FF9B82'][i % 4], animationDelay: `${i * 0.09}s` }} />)}</div>;
}
