import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Support", href: "/support" },
];

/**
 * Full-width header laid out like blockstream.com: at desktop widths a
 * 1fr / 5fr grid inside 100px side padding puts the app name on the left
 * (indented a further 20px) and the tabs right-aligned. Below 1090px the
 * tabs move into a no-JS disclosure menu. The wallet button stays visible at
 * every width.
 *
 * Positioned absolutely so it overlays the page's first section; pages
 * offset their content with `pt-(--header-height)`.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <div className="flex h-(--header-height) items-center justify-between gap-4 px-4 min-[1090px]:grid min-[1090px]:grid-cols-[1fr_5fr] min-[1090px]:gap-2.5 min-[1090px]:px-[100px]">
        <Link
          href="/"
          className="font-heading text-xl font-bold min-[1090px]:ml-5 min-[1090px]:justify-self-start"
        >
          TradeGuardian
        </Link>
        <div className="flex h-full items-center justify-end gap-2 min-[1090px]:gap-5">
          <nav
            aria-label="Primary"
            className="hidden h-full min-[1090px]:block"
          >
            <ul className="flex h-full items-center">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="type-nav relative block px-[15px] py-2 text-foreground after:absolute after:inset-x-[15px] after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ConnectWalletButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <details className="group min-[1090px]:hidden">
      <summary
        aria-label="Menu"
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md [&::-webkit-details-marker]:hidden"
      >
        <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
          <span className="h-0.5 bg-foreground" />
          <span className="h-0.5 bg-foreground" />
          <span className="h-0.5 bg-foreground" />
        </span>
      </summary>
      <nav
        aria-label="Primary"
        className="absolute inset-x-0 top-(--header-height) border-y border-border bg-background"
      >
        <ul className="flex flex-col px-4 py-2 sm:px-5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="type-nav block py-3">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
