"use client";

import { useState, useEffect } from "react";
import { getStoredSession, UserSession } from "@/lib/auth";

export function useUserSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncSession = () => {
      const stored = getStoredSession();
      if (stored) {
        setSession(stored);
        setIsLoading(false);
        return;
      }

      // Check query params if any
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const queryName = searchParams.get("name");
        if (queryName) {
          const querySession: UserSession = {
            id: `usr_${Date.now()}`,
            name: queryName,
            username: queryName.replace(/\s+/g, "_"),
            handle: `@${queryName.toLowerCase().replace(/\s+/g, "")}`,
            provider: "guest",
          };
          setSession(querySession);
        }
      }
      setIsLoading(false);
    };

    syncSession();

    // Listen for instant session changes from settings or login
    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserSession | null>;
      if (customEvent.detail !== undefined) {
        setSession(customEvent.detail);
      } else {
        syncSession();
      }
    };

    window.addEventListener("codearena_session_updated", handleSessionChange);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("codearena_session_updated", handleSessionChange);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return { session, isLoading };
}
