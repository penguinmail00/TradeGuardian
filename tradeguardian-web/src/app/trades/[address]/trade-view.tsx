"use client";

import { useParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getAddress, isAddress, type Address } from "viem";
import { useAccount } from "wagmi";

import { TradePanelPlaceholder } from "@/components/trades/trade-panel-placeholder";
import { TradeSteps } from "@/components/trades/trade-steps";
import { useArchiveTrade } from "@/lib/archive-trade";
import { canArchive, untitledTradeName, type Trade } from "@/lib/trades";
import { useTrade } from "@/lib/use-trades";

function subscribeToNothing() {
  return () => {};
}

/**
 * The trade panel for the escrow in the URL, loaded in the browser, under the
 * layout's back link, heading and explorer link.
 */
export function TradeView() {
  const { address } = useParams<{ address: string }>();
  if (!isAddress(address)) return <TradeNotFound isValidAddress={false} />;
  return <TradeDetails escrow={getAddress(address)} />;
}

function TradeDetails({ escrow }: { escrow: Address }) {
  const { address: account, status } = useAccount();
  // wagmi starts disconnected and reconnects the stored wallet after mount;
  // waiting for it keeps the role and actions from popping in afterwards.
  const isMounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const isWalletPending = !isMounted || status === "connecting" || status === "reconnecting";
  const { trade, isArchived, isLoading, isError, refetch, loadedAt } = useTrade(escrow, account);
  const archive = useArchiveTrade(account);
  useDocumentTitle(trade ? trade.itemName || untitledTradeName : undefined);

  if (isError) {
    return (
      <div role="alert" className="panel mt-10 flex flex-col items-start gap-4 px-5 py-6 lg:px-6">
        <p className="type-body text-muted">This trade couldn’t be loaded. Check your connection and try again.</p>
        <button type="button" onClick={() => refetch()} className="btn btn-secondary">
          Try again
        </button>
      </div>
    );
  }
  if (trade === null) return <TradeNotFound isValidAddress />;
  if (isWalletPending || isLoading || !trade) return <TradePanelPlaceholder />;

  return (
    <>
      <div className="panel mt-10 px-5 py-6 lg:px-6">
        <TradeSteps trade={trade} account={account} now={loadedAt} />
      </div>

      {account && canArchive(trade) && (
        <ArchiveButton
          trade={trade}
          isArchived={isArchived}
          onChange={archive.setArchived}
          isPending={archive.isPending}
          error={archive.error}
        />
      )}
    </>
  );
}

/**
 * The tab title once the trade is known, like "Road bike | TradeGuardian". The
 * page's static metadata title ("Trade | TradeGuardian") shows until then.
 */
function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} | TradeGuardian`;
  }, [title]);
}

function TradeNotFound({ isValidAddress }: { isValidAddress: boolean }) {
  useDocumentTitle("Trade not found");
  return (
    <div className="panel mt-10 px-5 py-6 lg:px-6">
      <p className="type-body text-muted">
        {isValidAddress
          ? "No trade was found for this address. Check the link, or view the contract on the explorer."
          : "This link doesn’t contain a valid contract address. Check the link and try again."}
      </p>
    </div>
  );
}

/**
 * Archives or unarchives a finished trade in the connected wallet's list,
 * after the wallet signs. The error from the last try shows beside it.
 */
function ArchiveButton({
  trade,
  isArchived,
  onChange,
  isPending,
  error,
}: {
  trade: Trade;
  isArchived: boolean;
  onChange: (trade: Trade, shouldArchive: boolean) => void;
  isPending: boolean;
  error: string | undefined;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      {error && (
        <p role="alert" className="type-small text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => onChange(trade, !isArchived)}
        aria-busy={isPending}
        disabled={isPending}
        className="btn btn-secondary w-full shrink-0 sm:w-auto"
      >
        {isPending ? (isArchived ? "Unarchiving…" : "Archiving…") : isArchived ? "Unarchive trade" : "Archive trade"}
      </button>
    </div>
  );
}
