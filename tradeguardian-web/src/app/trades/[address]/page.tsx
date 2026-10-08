import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isAddress, type Address } from "viem";

import { TradeSteps } from "@/components/trades/trade-steps";
import { getConnectedAccount } from "@/lib/connected-account";
import { syncTradeFromChain } from "@/lib/escrow-sync";
import { isArchived } from "@/lib/archived-trades";
import { canArchive, tradeStatuses, untitledTradeName } from "@/lib/trades";
import { fetchTrade, TradesApiError } from "@/lib/trades-api";

import { setTradeArchived } from "../actions";

// Archived status and the connected wallet are per user, so the page can't be
// prerendered and shared.
export const dynamic = "force-dynamic";

/**
 * The saved trade with its escrow's current state, read once per request.
 * Undefined for anything that isn't a saved escrow's address.
 */
const getTrade = cache(async (address: string) => {
  if (!isAddress(address)) return undefined;
  const trade = await fetchTrade(address);
  return trade && syncTradeFromChain(trade);
});

export async function generateMetadata({
  params,
}: PageProps<"/trades/[address]">): Promise<Metadata> {
  const { address } = await params;
  // A backend failure shows on the page (`error.tsx`); the title shouldn't
  // fail along with it.
  const trade = await getTrade(address).catch((error) => {
    if (error instanceof TradesApiError) return null;
    throw error;
  });
  if (trade === null) return { title: "Trade | TradeGuardian" };
  if (!trade) return { title: "Trade not found | TradeGuardian" };

  return {
    title: `${trade.itemName || untitledTradeName} | TradeGuardian`,
    description: tradeStatuses[trade.state].description,
  };
}

/**
 * A single trade, looked up by its escrow contract address, under the
 * layout's heading and explorer link. Rendered entirely on the server.
 */
export default async function TradePage({ params }: PageProps<"/trades/[address]">) {
  const { address } = await params;
  const [trade, account] = await Promise.all([getTrade(address), getConnectedAccount()]);
  if (!trade) notFound();

  return (
    <>
      <div className="panel mt-10 px-5 py-6 lg:px-6">
        <TradeSteps trade={trade} account={account} />
      </div>

      {canArchive(trade) && <ArchiveForm escrow={trade.escrow} isArchived={isArchived(trade)} />}
    </>
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
