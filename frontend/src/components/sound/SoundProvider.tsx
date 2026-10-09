"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import useSound from "use-sound";

export type SoundType =
  | "click"
  | "hover"
  | "pop"
  | "success"
  | "clash"
  | "victory"
  | "defeat"
  | "countdown"
  | "type";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (vol: number) => void;
  playClick: () => void;
  playHover: () => void;
  playPop: () => void;
  playSuccess: () => void;
  playClash: () => void;
  playVictory: () => void;
  playDefeat: () => void;
  playCountdown: () => void;
  playType: () => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

// Web Audio synthesizer helper for crisp arcade game sound effects
function playSynthesizedSound(type: SoundType, volume: number) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);

    const now = ctx.currentTime;

    switch (type) {
      case "success": {
        // High ascending cheerful chord
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          noteGain.gain.setValueAtTime(0, now + idx * 0.08);
          noteGain.gain.linearRampToValueAtTime(volume * 0.25, now + idx * 0.08 + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(noteGain);
          noteGain.connect(gainNode);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
        break;
      }
      case "clash": {
        // Sword slash / battle impact noise + pitch drop
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
        gainNode.gain.setValueAtTime(volume * 0.35, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case "victory": {
        // Heroic fanfare
        const fanfare = [
          { f: 587.33, d: 0.12, t: 0 },
          { f: 587.33, d: 0.12, t: 0.14 },
          { f: 587.33, d: 0.12, t: 0.28 },
          { f: 880.0, d: 0.4, t: 0.42 },
        ];
        fanfare.forEach(({ f, d, t }) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + t);
          noteGain.gain.setValueAtTime(volume * 0.3, now + t);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(noteGain);
          noteGain.connect(gainNode);
          osc.start(now + t);
          osc.stop(now + t + d + 0.05);
        });
        break;
      }
      case "defeat": {
        // Low descending defeat tone
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gainNode.gain.setValueAtTime(volume * 0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      case "countdown": {
        // Short beep
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case "type": {
        // Subtle mechanical keyboard clack
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
        gainNode.gain.setValueAtTime(volume * 0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
      default:
        break;
    }
  } catch {
    // AudioContext blocked or not allowed until user gesture
  }
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const storedMute = localStorage.getItem("codearena_sound_muted");
      if (storedMute !== null) return storedMute === "true";
    }
    return false;
  });

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedVol = localStorage.getItem("codearena_sound_vol");
      if (storedVol !== null) {
        const v = parseFloat(storedVol);
        if (!isNaN(v)) return v;
      }
    }
    return 0.5;
  });

  const handleSetVolume = useCallback((vol: number) => {
    setVolume(vol);
    localStorage.setItem("codearena_sound_vol", vol.toString());
  }, []);

  // use-sound audio hook bindings for wav assets
  const [playClickAudio] = useSound("/sounds/click.wav", {
    volume: isMuted ? 0 : volume,
    soundEnabled: !isMuted,
    interrupt: true,
  });

  const [playHoverAudio] = useSound("/sounds/hover.wav", {
    volume: isMuted ? 0 : volume * 0.4,
    soundEnabled: !isMuted,
    interrupt: true,
  });

  const [playPopAudio] = useSound("/sounds/pop.wav", {
    volume: isMuted ? 0 : volume * 0.8,
    soundEnabled: !isMuted,
    interrupt: true,
  });

  const playClick = useCallback(() => {
    if (isMuted) return;
    try {
      playClickAudio();
    } catch {
      playSynthesizedSound("type", volume);
    }
  }, [isMuted, playClickAudio, volume]);

  const playHover = useCallback(() => {
    if (isMuted) return;
    try {
      playHoverAudio();
    } catch {
      // ignore
    }
  }, [isMuted, playHoverAudio]);

  const playPop = useCallback(() => {
    if (isMuted) return;
    try {
      playPopAudio();
    } catch {
      playSynthesizedSound("countdown", volume);
    }
  }, [isMuted, playPopAudio, volume]);

  const playSuccess = useCallback(() => {
    if (isMuted) return;
    playSynthesizedSound("success", volume);
  }, [isMuted, volume]);

  const playClash = useCallback(() => {
    if (isMuted) return;
    playSynthesizedSound("clash", volume);
  }, [isMuted, volume]);

  const playVictory = useCallback(() => {
    if (isMuted) return;
    playSynthesizedSound("victory", volume);
  }, [isMuted, volume]);

  const playDefeat = useCallback(() => {
    if (isMuted) return;
    playSynthesizedSound("defeat", volume);
  }, [isMuted, volume]);

  const playCountdown = useCallback(() => {
    if (isMuted) return;
    playSynthesizedSound("countdown", volume);
  }, [isMuted, volume]);

  const playType = useCallback(() => {
    if (isMuted) return;
    playSynthesizedSound("type", volume);
  }, [isMuted, volume]);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;
      switch (type) {
        case "click":
          playClick();
          break;
        case "hover":
          playHover();
          break;
        case "pop":
          playPop();
          break;
        case "success":
          playSuccess();
          break;
        case "clash":
          playClash();
          break;
        case "victory":
          playVictory();
          break;
        case "defeat":
          playDefeat();
          break;
        case "countdown":
          playCountdown();
          break;
        case "type":
          playType();
          break;
      }
    },
    [isMuted, playClick, playHover, playPop, playSuccess, playClash, playVictory, playDefeat, playCountdown, playType]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("codearena_sound_muted", next.toString());
      if (!next) {
        // play small chime when unmuted
        playSynthesizedSound("countdown", volume);
      }
      return next;
    });
  }, [volume]);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        volume,
        setVolume: handleSetVolume,
        playClick,
        playHover,
        playPop,
        playSuccess,
        playClash,
        playVictory,
        playDefeat,
        playCountdown,
        playType,
        playSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const context = useContext(SoundContext);
  if (!context) {
    return {
      isMuted: false,
      toggleMute: () => {},
      volume: 0.5,
      setVolume: () => {},
      playClick: () => {},
      playHover: () => {},
      playPop: () => {},
      playSuccess: () => {},
      playClash: () => {},
      playVictory: () => {},
      playDefeat: () => {},
      playCountdown: () => {},
      playType: () => {},
      playSound: () => {},
    };
  }
  return context;
}
