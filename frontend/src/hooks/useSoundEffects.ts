"use client";

import { useSoundContext } from "@/components/sound/SoundProvider";

export function useSoundEffects() {
  const sound = useSoundContext();

  return {
    isMuted: sound.isMuted,
    toggleMute: sound.toggleMute,
    volume: sound.volume,
    setVolume: sound.setVolume,
    playClick: sound.playClick,
    playHover: sound.playHover,
    playPop: sound.playPop,
    playSuccess: sound.playSuccess,
    playClash: sound.playClash,
    playVictory: sound.playVictory,
    playDefeat: sound.playDefeat,
    playCountdown: sound.playCountdown,
    playType: sound.playType,
    playSound: sound.playSound,
  };
}
