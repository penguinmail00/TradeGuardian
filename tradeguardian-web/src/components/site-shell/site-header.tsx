import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { WalletOnly } from "@/components/wallet/wallet-only";

type NavLink = {
  label: string;
  href: string;
};

type NavItem = NavLink & {
  /** Revealed in a dropdown when the tab is hovered or focused. */
  children?: (NavLink & { icon: ReactNode })[];
  /** Only shown while a wallet is connected. */
  requiresWallet?: boolean;
};

const navItems: NavItem[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Support", href: "/support" },
  {
    label: "My Trades",
    href: "/trades",
    requiresWallet: true,
    children: [
      { label: "Create a trade", href: "/trades/create", icon: <FilePlusIcon /> },
      { label: "Add a trade", href: "/trades/new", icon: <PlusSquareIcon /> },
      {
        label: "Archived",
        href: "/trades?view=archived",
        icon: <ArchiveIcon />,
      },
    ],
  },
];

/**
 * Full-width header laid out like blockstream.com: at desktop widths a
 * 1fr / 5fr grid inside 100px side padding puts the app name on the left
 * (indented a further 20px) and the tabs right-aligned. Tabs with children
 * reveal them in a dropdown on hover or keyboard focus. Below 1090px the
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
          className="flex items-center gap-2.5 font-heading text-xl font-bold min-[1090px]:ml-5 min-[1090px]:justify-self-start"
        >
          <Image
            src="/images/tradeguardian.svg"
            alt=""
            width={444}
            height={501}
            preload
            className="h-7 w-auto min-[1090px]:h-8"
          />
          TradeGuardian
        </Link>
        <div className="flex h-full items-center justify-end gap-2 min-[1090px]:gap-5">
          <nav
            aria-label="Primary"
            className="hidden h-full min-[1090px]:block"
          >
            <ul className="flex h-full items-center">
              {navItems.map((item) => (
                <NavItemGate key={item.href} item={item}>
                  <li className="group/tab relative flex h-full items-center">
                    <Link
                      href={item.href}
                      className="type-nav relative block px-[15px] py-2 text-foreground after:absolute after:inset-x-[15px] after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 group-focus-within/tab:after:scale-x-100 group-hover/tab:after:scale-x-100"
                    >
                      {item.label}
                    </Link>
                    {item.children && <NavDropdown links={item.children} />}
                  </li>
                </NavItemGate>
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

/** Hides items marked `requiresWallet` until a wallet is connected. */
function NavItemGate({
  item,
  children,
}: {
  item: NavItem;
  children: ReactNode;
}) {
  return item.requiresWallet ? <WalletOnly>{children}</WalletOnly> : children;
}

/**
 * Matches blockstream.com's dropdown: a shadowed panel hanging from the
 * header's bottom edge that slides down (scaleY from the top) and fades in
 * over 0.4s, with a hairline top border and bold links that turn accent on
 * hover. Flush with its tab so the pointer can move into it without the hover
 * dropping.
 */
function NavDropdown({ links }: { links: NonNullable<NavItem["children"]> }) {
  return (
    <div className="absolute top-full left-0 z-10 origin-top scale-y-0 bg-surface-menu opacity-0 shadow-[0_10px_15px_-5px_#000] transition-all duration-400 ease-in-out group-focus-within/tab:scale-y-100 group-focus-within/tab:opacity-100 group-hover/tab:scale-y-100 group-hover/tab:opacity-100">
      <ul className="flex w-[300px] flex-col border-t border-border pt-[30px] pb-5">
        {links.map((link) => (
          <li key={link.href} className="mb-0.5">
            <Link
              href={link.href}
              className="group/link flex items-center px-4 py-2 font-heading text-base font-bold text-foreground transition-all duration-300 hover:text-accent focus-visible:text-accent"
            >
              <span className="min-w-[25px] text-nav-icon transition-colors duration-300 group-hover/link:text-accent group-focus-visible/link:text-accent">
                {link.icon}
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Outline icons sized like Blockstream's 15px Font Awesome Light glyphs. */
function PlusSquareIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="size-[15px]"
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
      <path d="M8 4.75v6.5M4.75 8h6.5" strokeLinecap="round" />
    </svg>
  );
}

function FilePlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="size-[15px]"
      aria-hidden="true"
    >
      <path
        d="M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9.5 1.5Z"
        strokeLinejoin="round"
      />
      <path d="M9.5 1.5V5H13M8 7.25v4.5M5.75 9.5h4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="size-[15px]"
      aria-hidden="true"
    >
      <rect x="1" y="2" width="14" height="3.5" rx="1" />
      <path
        d="M2.25 5.5v7.25a1 1 0 0 0 1 1h9.5a1 1 0 0 0 1-1V5.5M6.25 8.5h3.5"
        strokeLinecap="round"
      />
    </svg>
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
            <NavItemGate key={item.href} item={item}>
              <li>
                <Link href={item.href} className="type-nav block py-3">
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mb-2 border-l border-border pl-4">
                    {item.children.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="type-nav block py-2 text-muted"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </NavItemGate>
          ))}
        </ul>
      </nav>
    </details>
  );
}
