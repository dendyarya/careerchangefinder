/**
 * Fixed-size ad placeholder. Reserves space so the layout never shifts (CLS < 0.1).
 * Tahap 8 connects it to AdSense (loaded lazily, only after consent where required).
 * Until then it renders an empty labelled box in development and nothing visible in production.
 */
const SIZES = {
  leaderboard: { w: 728, h: 90, mw: 320, mh: 100 },
  rectangle: { w: 300, h: 250, mw: 300, mh: 250 },
  "in-content": { w: 728, h: 280, mw: 336, mh: 280 },
} as const;

export type AdSize = keyof typeof SIZES;

export function AdSlot({ size, id }: { size: AdSize; id: string }) {
  const s = SIZES[size];
  const dev = process.env.NODE_ENV !== "production";
  return (
    <div
      data-ad-slot={id}
      aria-hidden="true"
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
      {dev && <span className="text-small text-muted">Ad · {size}</span>}
    </div>
  );
}
