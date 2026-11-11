/**
 * Menus without dead links. The header, drawer, footer and "popular searches" are defined in lib/nav.ts
 * for the whole planned site; here every link is checked against the pages that are actually built and
 * published (the sitemap lists, which follow config/published.json). Groups with no live link and menus
 * whose own page does not exist yet are left out, so a menu appears by itself once its pages ship.
 */
import "server-only";
import { FOOTER_COLUMNS, MENUS, POPULAR_SEARCHES, type NavGroup, type NavLink, type NavMenu } from "@/lib/nav";
import { SITEMAP_NAMES, sitemapEntries } from "@/lib/sitemap";

let cache: Promise<Set<string>> | null = null;

function livePaths() {
  cache ??= (async () => {
    const live = new Set<string>();
    // state salary pages are never linked from the menus; skip the 7,000+ entries
    for (const n of SITEMAP_NAMES)
      for (const e of await sitemapEntries(n)) live.add(e.path);
    return live;
  })();
  return cache;
}

export async function liveNav(): Promise<{ menus: NavMenu[]; footer: NavGroup[]; popular: NavLink[] }> {
  const live = await livePaths();
  const ok = (l: NavLink) => live.has(l.href.split(/[?#]/)[0]!);
  const group = (g: NavGroup): NavGroup => ({
    ...g,
    links: g.links.filter(ok),
    more: g.more && ok(g.more) ? g.more : undefined,
  });
  const menus = MENUS.filter((m) => ok(m))
    .map((m) => ({
      ...m,
      groups: m.groups.map(group).filter((g) => g.links.length > 0),
      promo: m.promo && ok({ label: "", href: m.promo.href }) ? m.promo : undefined,
    }))
    .filter((m) => m.link || m.groups.length > 0);
  const footer = FOOTER_COLUMNS.map(group).filter((g) => g.links.length > 0);
  return { menus, footer, popular: POPULAR_SEARCHES.filter(ok) };
}
