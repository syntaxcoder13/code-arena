"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  prefixLabel?: string;
  className?: string;
  minWidth?: string;
  align?: "left" | "right";
}

export function CustomDropdown({
  options,
  value,
  onChange,
  prefixLabel,
  className = "",
  minWidth = "min-w-[160px]",
  align = "left",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { playClick, playHover, playPop } = useSoundEffects();

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    playClick();
    onChange(val);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    playPop();
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={`relative inline-block text-left ${isOpen ? "z-50" : "z-10"} ${className}`}
      ref={dropdownRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        onMouseEnter={() => playHover()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 font-mono text-xs font-semibold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer select-none shadow-xs"
      >
        <div className="flex items-center gap-1.5 truncate">
          {prefixLabel && (
            <span className="text-zinc-500 font-normal uppercase text-[10px]">
              {prefixLabel}:
            </span>
          )}
          {selectedOption?.icon}
          <span className="truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} z-50 mt-1.5 ${minWidth} rounded-xl border border-zinc-800/90 bg-[#0C0E14]/95 backdrop-blur-xl p-1.5 shadow-xl shadow-black/80 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-code-scroll`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => playHover()}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer select-none ${
                  isSelected
                    ? "bg-white text-black font-bold"
                    : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-black shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
