/**
 * Fixed-size ad space. Reserves room so the layout never shifts (CLS < 0.1).
 * On the production site with ADSENSE_CLIENT set and an ad unit ID for this size in config/ads.json,
 * it holds an AdSense unit; otherwise it is an empty labelled box in development and empty in production.
 */
import ads from "@/config/ads.json";
import { TRACKING } from "@/lib/tracking";
import { AdUnit } from "./AdUnit";

const SIZES = {
  leaderboard: { w: 728, h: 90, mw: 320, mh: 100 },
  rectangle: { w: 300, h: 250, mw: 300, mh: 250 },
  "in-content": { w: 728, h: 280, mw: 336, mh: 280 },
} as const;

export type AdSize = keyof typeof SIZES;

export function AdSlot({ size, id }: { size: AdSize; id: string }) {
  const s = SIZES[size];
  const dev = process.env.NODE_ENV !== "production";
  const unit = /^\d{6,20}$/.test(ads[size]) ? ads[size] : null;
  return (
    <div
      data-ad-slot={id}
      aria-hidden={TRACKING.adsenseClient && unit ? undefined : "true"}
      aria-label={TRACKING.adsenseClient && unit ? "Advertisement" : undefined}
      className="mx-auto flex items-center justify-center overflow-hidden"
      style={
        {
          width: "100%",
          maxWidth: `var(--ad-w)`,
          height: `var(--ad-h)`,
          "--ad-w": `${s.mw}px`,
          "--ad-h": `${s.mh}px`,
        } as React.CSSProperties
      }
    >
      <style>{`@media (min-width: 761px){[data-ad-slot="${id}"]{--ad-w:${s.w}px !important;--ad-h:${s.h}px !important}}`}</style>
      {TRACKING.adsenseClient && unit ? (
        <AdUnit client={TRACKING.adsenseClient} unit={unit} />
      ) : (
        dev && <span className="text-small text-muted">Ad · {size}</span>
      )}
    </div>
  );
}
