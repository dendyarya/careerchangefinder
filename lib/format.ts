/** Formatting helpers shared by pages. Numbers always come from data; these only format them. */

export const money = (n: number | null | undefined) => (n == null ? "—" : `$${n.toLocaleString("en-US")}`);

/** +16% / −11% / 0% with a real minus sign. */
export const signedPct = (n: number | null | undefined) =>
  n == null ? "—" : n > 0 ? `+${n}%` : n < 0 ? `−${Math.abs(n)}%` : "0%";

/** Design tokens rule: ≥ +3% gain, ≤ −3% loss, otherwise ink. Sign is always shown, never color alone. */
export const payChangeTone = (n: number | null | undefined) =>
  n == null ? "text-muted" : n >= 3 ? "text-gain" : n <= -3 ? "text-loss" : "text-ink";

export const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Elementary School Teachers, Except Special Education" -> "Elementary School Teachers" */
export const shortTitle = (title: string) => title.split(",")[0]!.trim();

/** Lowercase a career title for use inside a sentence, keeping acronyms. */
export const inSentence = (title: string) =>
  title
    .split(" ")
    .map((w) => (w.length > 1 && w === w.toUpperCase() ? w : w.toLowerCase()))
    .join(" ");

export const listJoin = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Trim to a limit on a word boundary (for meta descriptions). */
export const clip = (s: string, max: number) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

/** BLS "jobs per 1,000 jobs" exactly as published (up to 3 decimals), e.g. 18.609 or 0.38. */
export const per1000 = (n: number) => String(n);
