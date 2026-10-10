"use client";

import React, { useState, useEffect } from "react";
import { X, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<"bug" | "feature" | "general">("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { playPop, playClick, playSuccess } = useSoundEffects();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        playPop();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, playPop]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    playSuccess();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage("");
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    playPop();
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 sm:p-7 brutal-shadow-lg text-black selection:bg-[#E5FF45] selection:text-black"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close feedback modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-neutral-100 text-black hover:bg-[#E5FF45] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-[#E5FF45] px-2.5 py-1 font-mono text-[11px] font-black uppercase text-black mb-3">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>DEVELOPER TRANSMISSION</span>
        </div>

        <h2
          id="feedback-title"
          className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-black"
        >
          HELP & FEEDBACK
        </h2>
        <p className="mt-1 text-xs text-neutral-600">
          Have an idea for CodeArena or spotted a bug? Send your feedback directly to the dev team.
        </p>

        {submitted ? (
          <div className="mt-6 py-8 flex flex-col items-center justify-center text-center bg-neutral-50 rounded-xl border border-black/10">
            <CheckCircle2 className="h-10 w-10 text-[#34A853] mb-2 animate-bounce" />
            <h3 className="font-display text-base font-black uppercase text-black">
              TRANSMISSION RECEIVED!
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Thank you for contributing to the CodeArena dashboard preview.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Category selection */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600 mb-1.5">
                SELECT CATEGORY
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "general", label: "GENERAL" },
                    { id: "bug", label: "BUG REPORT" },
                    { id: "feature", label: "FEATURE" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setCategory(cat.id);
                    }}
                    className={`rounded-xl border-2 border-black py-2 text-xs font-display font-black uppercase transition-all cursor-pointer ${
                      category === cat.id
                        ? "bg-[#E5FF45] text-black brutal-shadow-sm"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-neutral-600 mb-1.5">
                YOUR MESSAGE
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your feedback, thoughts on the UI, or suggested features..."
                required
                className="w-full rounded-xl border-2 border-black bg-neutral-50 p-3 text-xs sm:text-sm font-sans placeholder:text-neutral-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#E5FF45]"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-black/20 text-xs font-bold uppercase text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#E5FF45] px-6 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black brutal-btn hover:bg-[#DAF428] transition-all cursor-pointer"
              >
                <span>TRANSMIT</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
