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
}

export function CustomDropdown({
  options,
  value,
  onChange,
  prefixLabel,
  className = "",
  minWidth = "min-w-[160px]",
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
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        onMouseEnter={() => playHover()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-2.5 rounded-xl border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black brutal-shadow-sm hover:bg-neutral-50 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 truncate">
          {prefixLabel && (
            <span className="text-neutral-500 font-normal uppercase text-[10px]">
              {prefixLabel}:
            </span>
          )}
          {selectedOption?.icon}
          <span className="truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-black shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute right-0 sm:left-0 z-50 mt-1.5 ${minWidth} rounded-xl border-2 border-black bg-white p-1.5 brutal-shadow animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-code-scroll`}
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
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer select-none ${
                  isSelected
                    ? "bg-black text-[#E5FF45]"
                    : "text-black hover:bg-[#E5FF45] hover:text-black"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#E5FF45] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
