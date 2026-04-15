"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "brain" },
  { href: "/graph", label: "graph" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 mt-2" aria-label="Main navigation">
      {links.map(({ href, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`text-xs transition-colors ${
              active
                ? "text-amber"
                : "text-text-secondary hover:text-amber"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
