"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface GoogleAuthButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GoogleAuthButton({
  onClick,
  isLoading = false,
  disabled = false,
  className = "",
}: GoogleAuthButtonProps) {
  const { playClick, playHover } = useSoundEffects();

  const handleClick = () => {
    if (disabled || isLoading) return;
    playClick();
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => !disabled && !isLoading && playHover()}
      disabled={disabled || isLoading}
      aria-label="Continue with Google"
      className={`group relative flex w-full items-center justify-center gap-3.5 rounded-xl border-[2.5px] border-black bg-white px-5 py-3.5 font-display text-sm sm:text-base font-black text-black brutal-btn transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none active:scale-[0.99] ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-black" />
      ) : (
        <svg
          className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span className="tracking-tight">
        {isLoading ? "Connecting to Google..." : "Continue with Google"}
      </span>
    </button>
  );
}
