import Link from "next/link";

export function LinkGrid({ links }: { links: { href: string; label: string; count?: number }[] }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="flex items-center justify-between gap-3 rounded-[12px] border-[1.5px] border-mist bg-white px-5 py-4 font-bold text-ink no-underline hover:border-primary">
            <span>{l.label}</span>
            {l.count != null && <span className="shrink-0 text-small font-medium text-muted">{l.count}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
