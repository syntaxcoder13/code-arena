"use client";

import type { Match } from "@/types/match";

export function useMatch() {
  // Placeholder for matchmaking logic
  const match: Match | null = null;
  const isLoading = false;

  return {
    match,
    isLoading,
  };
}
