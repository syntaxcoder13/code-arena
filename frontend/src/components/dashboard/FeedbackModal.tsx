"use client";

import { api, apiError } from "@/lib/api";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try { await api.post("/api/codearena/feedback", { category, message }); } catch (e) { window.alert(apiError(e)); return; }
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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800/80 bg-[#0C0E14] p-6 sm:p-7 shadow-2xl shadow-black/80 text-white selection:bg-white selection:text-black"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close feedback modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-800/60 px-3 py-1 font-mono text-[11px] font-bold uppercase text-zinc-300 mb-3">
          <MessageSquare className="h-3.5 w-3.5 text-[#00F0FF]" />
          <span>DEVELOPER TRANSMISSION</span>
        </div>

        <h2
          id="feedback-title"
          className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white"
        >
          HELP & FEEDBACK
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Have an idea for CodeArena or spotted a bug? Send your feedback directly to the dev team.
        </p>

        {submitted ? (
          <div className="mt-6 py-8 flex flex-col items-center justify-center text-center bg-zinc-900/60 rounded-xl border border-zinc-800">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2 animate-bounce" />
            <h3 className="font-display text-base font-bold uppercase text-white">
              TRANSMISSION RECEIVED!
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Thank you for contributing to the CodeArena dashboard preview.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Category selection */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
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
                    className={`rounded-xl border py-2 text-xs font-display font-bold uppercase transition-all cursor-pointer ${
                      category === cat.id
                        ? "bg-white text-black border-white shadow-sm"
                        : "bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
                YOUR MESSAGE
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your feedback, thoughts on the UI, or suggested features..."
                required
                className="w-full rounded-xl border border-zinc-800 bg-[#080A0F] p-3.5 text-xs sm:text-sm font-sans text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-bold uppercase text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
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
