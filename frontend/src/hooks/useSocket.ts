"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export function useSocket() {
  useEffect(() => {
    // Placeholder for socket lifecycle management
  }, []);

  return { socket };
}
