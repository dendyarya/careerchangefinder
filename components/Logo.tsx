import Link from "next/link";

export function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      <rect width="44" height="44" rx="13" fill="#1D62AF" />
      <path
        d="M11 30 L11 22 Q11 16 17 16 L27 16 Q33 16 33 22 L33 30"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="0.1 6"
      />
      <circle cx="11" cy="30" r="4" fill="#FFFFFF" />
      <circle cx="33" cy="30" r="4.6" fill="#1D91F1" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 text-ink no-underline hover:text-ink"
      aria-label="Career Change Finder home"
    >
      <span className="hidden md:inline">
        <LogoMark size={42} />
      </span>
      <span className="md:hidden">
        <LogoMark size={38} />
      </span>
      <span className="font-display text-[19px] leading-none font-bold tracking-[-0.02em] md:text-[clamp(19px,2vw,24px)]">
        Career Change <span className="text-primary">Finder</span>
      </span>
    </Link>
  );
}
