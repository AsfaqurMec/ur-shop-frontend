"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function FacebookPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}