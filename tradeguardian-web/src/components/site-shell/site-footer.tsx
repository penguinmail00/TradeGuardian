import Link from "next/link";

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border-footer">
      <div className="type-small mx-auto flex w-[calc(100%-60px)] max-w-[1140px] flex-col gap-3 py-8 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TradeGuardian</p>
        <nav aria-label="Legal" className="flex gap-6">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
