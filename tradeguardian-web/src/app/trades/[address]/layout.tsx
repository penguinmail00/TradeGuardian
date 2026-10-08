import { isAddress } from "viem";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { BackToTradesLink } from "@/components/trades/back-to-trades-link";
import { explorerName, getExplorerAddressUrl } from "@/lib/explorer";

/**
 * Everything on a trade page that only needs the escrow's address from the
 * URL: the back link, heading and explorer link. They render straight away
 * and stay while the trade loads or fails to, so the explorer link always
 * works, even when the backend can't be reached. The page fills in the trade
 * below, in the browser.
 */
export default async function TradeLayout({ children, params }: LayoutProps<"/trades/[address]">) {
  const { address } = await params;

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-16 lg:pt-24 lg:pb-24">
            <BackToTradesLink />
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="type-h1">Transaction Details</h1>
              {/* An invalid address has nothing to link to; the page turns it
                  into a not-found. */}
              {isAddress(address) && (
                <a
                  href={getExplorerAddressUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary self-start sm:self-auto"
                >
                  View on {explorerName}
                  <ExternalLinkIcon />
                </a>
              )}
            </div>
            {children}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
