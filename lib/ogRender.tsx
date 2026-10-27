import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { OgCard } from "@/lib/og";
import { SITE } from "@/lib/site";

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), "lib", "og-fonts", f));
let fonts: { name: string; data: Buffer; weight: 500 | 700 }[] | null = null;
const MARK = `data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(path.join(process.cwd(), "app", "icon.svg"))).toString("base64")}`;

export function renderCard(card: OgCard): ImageResponse {
  fonts ??= [
    { name: "Space Grotesk", data: font("space-grotesk-latin-700-normal.woff"), weight: 700 },
    { name: "Manrope", data: font("manrope-latin-500-normal.woff"), weight: 500 },
    { name: "Manrope", data: font("manrope-latin-700-normal.woff"), weight: 700 },
  ];
  const titleSize = card.title.length > 70 ? 46 : card.title.length > 45 ? 56 : 66;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFFFFF", padding: "64px 72px", fontFamily: "Manrope", color: "#0F2747" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={56} height={56} alt="" />
          <div style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, display: "flex" }}>
            Career Change <span style={{ color: "#1D62AF", marginLeft: 10 }}>Finder</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1D62AF", textTransform: "uppercase", letterSpacing: 2 }}>{card.eyebrow}</div>
          <div style={{ fontFamily: "Space Grotesk", fontSize: titleSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{card.title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {card.stat ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 24, color: "#5B6B82" }}>{card.stat.label}</div>
              <div style={{ fontFamily: "Space Grotesk", fontSize: 44, fontWeight: 700 }}>{card.stat.value}</div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div style={{ fontSize: 22, color: "#5B6B82", display: "flex" }}>{SITE.url.replace("https://", "")} · O*NET 31.0 + BLS May 2025</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
