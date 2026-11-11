"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CTA, type NavLink, type NavMenu } from "@/lib/nav";
import { Chevron, CloseIcon, MenuIcon, SearchIcon } from "./icons";
import { Logo } from "./Logo";
import { SearchPanel } from "./SearchPanel";
import { useFocusTrap } from "./useFocusTrap";

function MegaPanel({ menu, onNavigate }: { menu: NavMenu; onNavigate: () => void }) {
  // column widths as in the mockup: two-column link groups get more room
  const template = [
    ...menu.groups.map((g) => (g.columns === 2 ? "1.5fr" : "1fr")),
    ...(menu.promo ? ["1.1fr"] : []),
  ].join(" ");
  return (
    <div
      id={`mega-${menu.id}`}
      role="region"
      aria-label={`${menu.label} menu`}
      className="absolute inset-x-0 top-full z-40 mx-auto mt-3.5 max-w-[1312px] px-8"
    >
      <div
        className="grid gap-8 rounded-lg border-[1.5px] border-mist bg-white p-9 shadow-md"
        style={{ gridTemplateColumns: template }}
      >
        {menu.groups.map((g) => (
          <div key={g.title} className="flex min-w-0 flex-col gap-3">
            <p className="m-0 font-display text-[20px] font-bold leading-tight">{g.title}</p>
            <ul
              className={`m-0 list-none p-0 ${g.columns === 2 ? "grid grid-cols-2 gap-x-5 gap-y-2.5 text-ui" : "flex flex-col gap-3"}`}
            >
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onNavigate}
                    className={`text-ink no-underline hover:text-primary hover:underline ${g.columns === 2 ? "font-medium" : "font-bold"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {g.more && (
              <Link href={g.more.href} onClick={onNavigate} className="font-extrabold">
                {g.more.label}
              </Link>
            )}
          </div>
        ))}
        {menu.promo && (
          <Link
            href={menu.promo.href}
            onClick={onNavigate}
            className="flex flex-col gap-3 self-start rounded-[20px] border-[1.5px] border-mist bg-panel p-6 text-ink no-underline hover:text-ink"
          >
            <span className="font-display text-[22px] leading-tight font-bold">{menu.promo.title}</span>
            <span className="text-ui leading-normal text-muted">{menu.promo.text}</span>
            <span className="self-start rounded-[10px] bg-primary px-[18px] py-2.5 text-ui font-extrabold text-white">
              {menu.promo.cta}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

function Drawer({ menus, onClose, onSearch }: { menus: NavMenu[]; onClose: () => void; onSearch: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  useFocusTrap(ref, true);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-50 flex flex-col bg-white xl:hidden"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex items-center gap-2.5 border-b-[1.5px] border-mist px-4 py-3.5">
        <div className="flex-1">
          <Logo />
        </div>
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="flex h-12 w-12 items-center justify-center rounded-[10px] border-[1.5px] border-mist bg-white text-ink"
        >
          <CloseIcon />
        </button>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-4 pb-8">
        <button
          type="button"
          onClick={onSearch}
          className="mt-4 flex h-[52px] w-full items-center gap-3 rounded-full border-[1.5px] border-field-border bg-white px-[18px] text-left text-muted"
        >
          <SearchIcon /> Search careers
        </button>
        <ul className="m-0 mt-2 list-none p-0">
          {menus.map((m) => {
            const open = openId === m.id;
            if (m.link)
              return (
                <li key={m.id} className="border-b-[1.5px] border-mist">
                  <Link
                    href={m.href}
                    onClick={onClose}
                    className="flex w-full py-4 font-display text-[22px] font-bold text-ink no-underline"
                  >
                    {m.label}
                  </Link>
                </li>
              );
            return (
              <li key={m.id} className="border-b-[1.5px] border-mist">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`drawer-${m.id}`}
                  onClick={() => setOpenId(open ? null : m.id)}
                  className="flex w-full items-center justify-between py-4 text-left font-display text-[22px] font-bold text-ink"
                >
                  {m.label} <Chevron open={open} />
                </button>
                {open && (
                  <div id={`drawer-${m.id}`} className="flex flex-col gap-5 pb-5">
                    <Link href={m.href} onClick={onClose} className="font-extrabold">
                      {m.label} overview →
                    </Link>
                    {m.groups.map((g) => (
                      <div key={g.title}>
                        <p className="m-0 mb-2 text-small font-extrabold text-muted">{g.title}</p>
                        <ul
                          className={`m-0 list-none p-0 ${g.columns === 2 ? "grid grid-cols-2 gap-x-4 gap-y-2" : "flex flex-col gap-2"}`}
                        >
                          {g.links.map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} onClick={onClose} className="font-semibold text-ink no-underline">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {g.more && (
                          <Link href={g.more.href} onClick={onClose} className="mt-2 inline-block font-extrabold">
                            {g.more.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <Link
          href={CTA.href}
          onClick={onClose}
          className="mt-6 flex h-[52px] items-center justify-center rounded-full bg-primary text-ui font-extrabold text-white no-underline hover:text-white"
        >
          Take the {CTA.label}
        </Link>
      </nav>
    </div>
  );
}

/** `menus` and `popular` hold only links to pages that exist (filtered on the server, lib/liveNav.ts). */
export function Header({ careerCount, menus, popular }: { careerCount: number; menus: NavMenu[]; popular: NavLink[] }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  // close everything on navigation (state reset during render, not in an effect)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
    setDrawerOpen(false);
    setSearchOpen(false);
  }

  // "/" opens search, Esc closes the mega-menu, click outside closes it
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      if (e.key === "/" && !typing && !searchOpen) {
        e.preventDefault();
        setOpenMenu(null);
        setSearchOpen(true);
      } else if (e.key === "Escape" && openMenu) {
        const id = openMenu;
        setOpenMenu(null);
        document.getElementById(`menu-btn-${id}`)?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (openMenu && headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [openMenu, searchOpen]);

  const active = menus.find((m) => m.id === openMenu);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header ref={headerRef} className="relative z-40 border-b-[1.5px] border-mist bg-white">
        <div className="mx-auto flex max-w-[1312px] items-center gap-2.5 px-4 py-3.5 md:gap-4 md:px-8 2xl:gap-6">
          <div className="flex-1 xl:flex-none">
            <Logo />
          </div>
          <nav aria-label="Main" className="hidden flex-1 justify-center xl:flex">
            <ul className="m-0 flex list-none gap-6 p-0 text-[16px] font-bold 2xl:gap-[30px] 2xl:text-ui">
              {menus.map((m) => {
                const open = openMenu === m.id;
                const current = pathname === m.href || pathname.startsWith(`${m.href}/`);
                if (m.link)
                  return (
                    <li key={m.id}>
                      <Link
                        href={m.href}
                        aria-current={current ? "page" : undefined}
                        onClick={() => setOpenMenu(null)}
                        className={`-mx-3 -my-1.5 flex items-center rounded-full px-3 py-1.5 whitespace-nowrap no-underline ${current ? "text-ink" : "text-slate hover:text-ink"}`}
                      >
                        {m.label}
                      </Link>
                    </li>
                  );
                return (
                  <li key={m.id}>
                    <button
                      id={`menu-btn-${m.id}`}
                      type="button"
                      aria-expanded={open}
                      aria-controls={`mega-${m.id}`}
                      aria-current={current ? "true" : undefined}
                      onClick={() => setOpenMenu(open ? null : m.id)}
                      className={`-mx-3 -my-1.5 flex items-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap ${open ? "bg-mist text-ink" : current ? "text-ink" : "text-slate hover:text-ink"}`}
                    >
                      {m.label} <Chevron open={open} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button
            type="button"
            aria-label="Search careers (press /)"
            title="Search careers ( / )"
            onClick={() => {
              setOpenMenu(null);
              setSearchOpen(true);
            }}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-mist bg-white text-ink md:h-12 md:w-12 md:rounded-full md:bg-ice"
          >
            <SearchIcon />
          </button>
          <Link
            href={CTA.href}
            className="hidden h-12 shrink-0 items-center rounded-full bg-primary px-[18px] text-[16px] font-extrabold whitespace-nowrap text-white no-underline hover:bg-ink hover:text-white lg:inline-flex 2xl:px-[22px] 2xl:text-ui"
          >
            {CTA.label}
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            onClick={() => setDrawerOpen(true)}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] bg-primary text-white xl:hidden"
          >
            <MenuIcon />
          </button>
        </div>
        {active && <MegaPanel menu={active} onNavigate={() => setOpenMenu(null)} />}
      </header>
      {active && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 hidden bg-[rgba(28,28,28,0.28)] xl:block"
          onClick={() => setOpenMenu(null)}
        />
      )}
      {drawerOpen && (
        <Drawer
          menus={menus}
          onClose={() => setDrawerOpen(false)}
          onSearch={() => {
            setDrawerOpen(false);
            setSearchOpen(true);
          }}
        />
      )}
      {searchOpen && <SearchPanel careerCount={careerCount} popular={popular} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
