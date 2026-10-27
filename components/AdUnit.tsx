"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** One AdSense display unit. The consent message and personalization are handled by Google's CMP. */
export function AdUnit({ client, unit }: { client: string; unit: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // blocked by an ad blocker or not loaded yet: the reserved space simply stays empty
    }
  }, []);
  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", width: "100%", height: "100%" }}
      data-ad-client={client}
      data-ad-slot={unit}
    />
  );
}
