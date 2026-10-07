import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Address } from "viem";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { BackToTradesLink } from "@/components/trades/back-to-trades-link";
import { TradeSteps } from "@/components/trades/trade-steps";
import { getConnectedAccount } from "@/lib/connected-account";
import { syncTradeFromChain } from "@/lib/escrow-sync";
import { explorerName, getExplorerAddressUrl } from "@/lib/explorer";
import { findTrade, isArchived } from "@/lib/fake-trades";
import { canArchive, tradeStatuses, untitledTradeName } from "@/lib/trades";

import { setTradeArchived } from "../actions";

// Archived status and the connected wallet are per user, so the page can't be
// prerendered and shared.
export const dynamic = "force-dynamic";

/** The trade with its escrow's current state, read once per request. */
const getTrade = cache(async (address: string) => {
  const trade = findTrade(address);
  return trade && syncTradeFromChain(trade);
});

export async function generateMetadata({
  params,
}: PageProps<"/trades/[address]">): Promise<Metadata> {
  const { address } = await params;
  const trade = await getTrade(address);
  if (!trade) return { title: "Trade not found | TradeGuardian" };

  return {
    title: `${trade.itemName || untitledTradeName} | TradeGuardian`,
    description: tradeStatuses[trade.state].description,
  };
}

/**
 * A single trade, looked up by its escrow contract address. Rendered entirely
 * on the server.
 */
export default async function TradePage({ params }: PageProps<"/trades/[address]">) {
  const { address } = await params;
  const [trade, account] = await Promise.all([getTrade(address), getConnectedAccount()]);
  if (!trade) notFound();

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-16 lg:pt-24 lg:pb-24">
            <BackToTradesLink />
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="type-h1">Transaction Details</h1>
              <a
                href={getExplorerAddressUrl(trade.escrow)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary self-start sm:self-auto"
              >
                View on {explorerName}
                <ExternalLinkIcon />
              </a>
            </div>
            <div className="panel mt-10 px-5 py-6 lg:px-6">
              <TradeSteps trade={trade} account={account} />
            </div>

            {canArchive(trade) && <ArchiveForm escrow={trade.escrow} isArchived={isArchived(trade)} />}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * Plain form posting to a server action, so it works before hydration. The
 * page re-renders with the new state once the action revalidates it.
 */
function ArchiveForm({ escrow, isArchived }: { escrow: Address; isArchived: boolean }) {
  return (
    <form
      action={setTradeArchived}
      className="mt-6 flex sm:justify-end"
    >
      <input type="hidden" name="escrow" value={escrow} />
      <input type="hidden" name="archived" value={isArchived ? "false" : "true"} />
      <button type="submit" className="btn btn-secondary w-full shrink-0 sm:w-auto">
        {isArchived ? "Unarchive trade" : "Archive trade"}
      </button>
    </form>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
