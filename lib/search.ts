/** Client-side career search over /search-index.json. Pure functions, unit-tested. */

export interface SearchEntry {
  s: string; // slug
  t: string; // title
  a: string[]; // alternate titles
  p: number | null; // BLS median pay (null when only a broader group wage exists)
  e?: number | null; // BLS employment, used to show common jobs first
}

export interface HubEntry {
  slug: string;
  singular: string;
  plural: string;
}

export interface SearchHit {
  slug: string;
  title: string;
  pay: number | null;
  matchedAlt: string | null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Rank: title starts with query (0) < a word in the title starts with it (1) < title contains it (2)
 * < an alternate title starts with it (3) < an alternate title contains it (4).
 * Within a rank, title-start and word-start count as one tier (0-1); ties go to the job with more
 * workers (BLS employment), then A–Z, so common jobs like Elementary School Teachers come first.
 */
export function searchCareers(index: SearchEntry[], query: string, limit = 6): SearchHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const scored: { hit: SearchHit; rank: number; emp: number }[] = [];
  for (const e of index) {
    const t = norm(e.t);
    let rank = -1;
    let matchedAlt: string | null = null;
    if (t.startsWith(q)) rank = 0;
    else if (t.split(" ").some((w) => w.startsWith(q))) rank = 1;
    else if (words.every((w) => t.includes(w))) rank = 2;
    else {
      for (const alt of e.a) {
        const a = norm(alt);
        if (a.startsWith(q) || a.split(" ").some((w) => w.startsWith(q))) {
          rank = 3;
          matchedAlt = alt;
          break;
        }
        if (rank < 0 && words.every((w) => a.includes(w))) {
          rank = 4;
          matchedAlt = alt;
        }
      }
    }
    if (rank >= 0) scored.push({ hit: { slug: e.s, title: e.t, pay: e.p, matchedAlt }, rank, emp: e.e ?? 0 });
  }
  const tier = (r: number) => (r <= 1 ? 0 : r);
  scored.sort((x, y) => tier(x.rank) - tier(y.rank) || y.emp - x.emp || x.hit.title.localeCompare(y.hit.title));
  return scored.slice(0, limit).map((x) => x.hit);
}

/** "teach" -> Teachers hub, "nurs" -> Nurses hub. Matches the start of a word in the hub name. */
export function matchHub(hubs: HubEntry[], query: string): HubEntry | null {
  const q = norm(query);
  if (q.length < 3) return null;
  return (
    hubs.find((h) =>
      [h.singular, h.plural].some((n) =>
        norm(n)
          .split(" ")
          .some((w) => w.startsWith(q) || q.startsWith(w)),
      ),
    ) ?? null
  );
}

export const formatPay = (n: number) => `$${n.toLocaleString("en-US")}`;
