"use client";

import { useRouter } from "next/navigation";

declare global {
  interface Window {
    googlefc?: { callbackQueue: unknown[]; showRevocationMessage: () => void };
  }
}

/**
 * Re-opens Google's consent message so visitors can change their choice. AdSense requires this link at
 * the bottom of the site when its European regulations message is used.
 */
export function PrivacySettingsLink({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const fc = window.googlefc;
        if (fc) fc.callbackQueue.push(fc.showRevocationMessage);
        else router.push("/privacy");
      }}
    >
      Privacy and cookie settings
    </button>
  );
}
