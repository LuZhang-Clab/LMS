"use client";

import { useEffect } from "react";
import { initCursor } from "@/lib/cursor";

export default function CursorProvider() {
  useEffect(() => {
    initCursor();
  }, []);
  return null;
}
