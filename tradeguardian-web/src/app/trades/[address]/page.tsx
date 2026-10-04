import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { formatEther, type Address, type Hash } from "viem";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { CopyButton } from "@/components/trades/copy-button";
import { TradeTimestamp } from "@/components/trades/trade-time";
import { TradeStatusBadge } from "@/components/trades/trade-status-badge";
import { currentUser, findTrade, isArchived } from "@/lib/fake-trades";
import { getRequestTime } from "@/lib/request-time";
import { canArchive, getDeposit, tradeStatuses } from "@/lib/trades";

import { setTradeArchived } from "../actions";

// Archived status is per user, so the page can't be prerendered and shared.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/trades/[address]">): Promise<Metadata> {
  const { address } = await params;
  const trade = findTrade(address);
  if (!trade) return { title: "Trade not found | TradeGuardian" };

  return {
    title: `${trade.itemName} | TradeGuardian`,
    description: tradeStatuses[trade.state].description,
  };
}

/**
 * A single trade, looked up by its escrow contract address. Rendered entirely
 * on the server.
 */
export default async function TradePage({ params }: PageProps<"/trades/[address]">) {
  const { address } = await params;
  const trade = findTrade(address);
  if (!trade) notFound();

  const isSeller = trade.seller === currentUser;
  const price = `${formatEther(trade.itemPrice)} MON`;

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-16 lg:pt-24 lg:pb-24">
            <Link
              href="/trades"
              className="type-small text-muted transition-colors hover:text-foreground"
            >
              ← My trades
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <h1 className="type-h1">Transaction Details</h1>
              <TradeStatusBadge state={trade.state} />
            </div>
            <p className="type-body-lg mt-4 text-muted text-pretty">
              {tradeStatuses[trade.state].description}
            </p>

            <dl className="panel type-body mt-10 divide-y divide-border">
              <DetailRow label="Contract Address">
                <AddressValue address={trade.escrow} copyLabel="Copy contract address" />
              </DetailRow>
              <DetailRow label="Transaction ID">
                <AddressValue address={trade.transactionHash} copyLabel="Copy transaction ID" />
              </DetailRow>
              <DetailRow label="Item price">{price}</DetailRow>
              <DetailRow label="Your deposit">
                {formatEther(getDeposit(trade, isSeller))} MON
              </DetailRow>
              <DetailRow label="Seller">
                <AddressValue address={trade.seller} copyLabel={isSeller ? undefined : "Copy seller address"} />
              </DetailRow>
              <DetailRow label="Buyer">
                <AddressValue address={trade.buyer} copyLabel={isSeller ? "Copy buyer address" : undefined} />
              </DetailRow>
              <DetailRow label="Created">
                <TradeTimestamp dateTime={trade.createdAt.toISOString()} serverNow={getRequestTime()} />
              </DetailRow>
              <DetailRow label="Item name">{trade.itemName}</DetailRow>
              <DetailRow label="Description" isParagraph>
                {trade.description}
              </DetailRow>
            </dl>

            {canArchive(trade) && <ArchiveForm escrow={trade.escrow} isArchived={isArchived(trade)} />}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * Label on the left, value on the right. `isParagraph` left-aligns the value
 * and keeps its line breaks, for free text like the description.
 */
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

function DetailRow({
  label,
  isParagraph = false,
  children,
}: {
  label: string;
  isParagraph?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between sm:gap-6 lg:px-6">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd
        className={
          isParagraph ? "whitespace-pre-line text-pretty sm:max-w-[65%]" : "sm:text-right"
        }
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * Full address or transaction hash so it can be checked character by
 * character; marks the user's own address. Pass `copyLabel` to show a copy
 * button.
 */
function AddressValue({ address, copyLabel }: { address: Address | Hash; copyLabel?: string }) {
  return (
    <span className="flex items-center gap-2 sm:justify-end">
      <span className="min-w-0 font-mono break-all text-balance">
        {address}
        {address === currentUser && <span className="font-sans text-muted"> (you)</span>}
      </span>
      {copyLabel && <CopyButton value={address} label={copyLabel} />}
    </span>
  );
}
