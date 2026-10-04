import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { formatEther, type Address, type Hash } from "viem";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { BackToTradesLink } from "@/components/trades/back-to-trades-link";
import { CopyButton } from "@/components/trades/copy-button";
import { EscrowActionButton } from "@/components/trades/escrow-action-button";
import { TradeTimestamp } from "@/components/trades/trade-time";
import { TradeStatusBadge } from "@/components/trades/trade-status-badge";
import { explorerName, getExplorerAddressUrl } from "@/lib/explorer";
import { currentUser, findTrade, isArchived } from "@/lib/fake-trades";
import { getRequestTime } from "@/lib/request-time";
import {
  canArchive,
  canCancel,
  getDeposit,
  getExpiration,
  isExpired,
  needsDeposit,
  tradeStatuses,
} from "@/lib/trades";

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
  const deposit = getDeposit(trade, isSeller);

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
            <dl className="panel type-body mt-10 divide-y divide-border">
              <DetailRow label="Status">
                <span className="flex flex-col items-start gap-3 sm:items-end">
                  <TradeStatusBadge state={trade.state} />
                  <span className="type-small max-w-[45ch] text-muted text-pretty sm:text-right">
                    {tradeStatuses[trade.state].description}
                  </span>
                  {trade.state === "AWAITING_DEPOSIT" && (
                    <ul aria-label="Deposits" className="flex flex-col gap-1.5">
                      <DepositStatus
                        side="Seller"
                        hasDeposited={trade.hasSellerDeposited}
                        amount={getDeposit(trade, true)}
                      />
                      <DepositStatus
                        side="Buyer"
                        hasDeposited={trade.hasBuyerDeposited}
                        amount={getDeposit(trade, false)}
                      />
                    </ul>
                  )}
                </span>
              </DetailRow>
              <DetailRow label="Contract Address">
                <AddressValue address={trade.escrow} copyLabel="Copy contract address" />
              </DetailRow>
              <DetailRow label="Transaction ID">
                <AddressValue address={trade.transactionHash} copyLabel="Copy transaction ID" isSingleLine />
              </DetailRow>
              <DetailRow label="Item price">{price}</DetailRow>
              <DetailRow label="Your deposit">
                {formatEther(deposit)} MON
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
              <DetailRow label="Expiration">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
                  {isExpired(trade, getRequestTime()) && (
                    <span className="type-small inline-block rounded-full bg-danger/10 px-3 py-1 font-medium whitespace-nowrap text-danger">
                      Expired
                    </span>
                  )}
                  <TradeTimestamp dateTime={getExpiration(trade).toISOString()} serverNow={getRequestTime()} />
                </span>
              </DetailRow>
              <DetailRow label="Item name">{trade.itemName}</DetailRow>
              <DetailRow label="Description" isParagraph>
                {trade.description}
              </DetailRow>
            </dl>

            {needsDeposit(trade, isSeller) && (
              <div className="mt-6">
                <EscrowActionButton
                  escrow={trade.escrow}
                  account={currentUser}
                  functionName={isSeller ? "sellerDeposit" : "buyerDeposit"}
                  value={deposit}
                  verb="deposit"
                  label={`Deposit ${formatEther(deposit)} MON`}
                  pendingLabel="Depositing…"
                  successMessage="Deposit confirmed."
                />
              </div>
            )}
            {canCancel(trade, isSeller, getRequestTime()) && (
              <div className="mt-6">
                <EscrowActionButton
                  escrow={trade.escrow}
                  account={currentUser}
                  functionName="withdraw"
                  verb="cancel the trade"
                  label="Cancel trade"
                  pendingLabel="Canceling…"
                  successMessage="Trade canceled. Your deposit was returned."
                  variant="destructive"
                />
              </div>
            )}
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
          isParagraph ? "whitespace-pre-line text-pretty sm:max-w-[65%]" : "min-w-0 sm:text-right"
        }
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * One line of the deposit checklist: a filled check once this side has locked
 * its deposit, an empty dashed circle until then. Rows are left-aligned with
 * each other so the icons line up, even when the list sits on the right.
 */
function DepositStatus({
  side,
  hasDeposited,
  amount,
}: {
  side: "Seller" | "Buyer";
  hasDeposited: boolean;
  /** In wei; what this side deposits, shown once it has. */
  amount: bigint;
}) {
  return (
    <li className={`type-small flex items-center gap-2 ${hasDeposited ? "text-green" : "text-muted"}`}>
      {hasDeposited ? <CheckCircleIcon /> : <PendingCircleIcon />}
      {hasDeposited
        ? `${side} has deposited ${formatEther(amount)} MON`
        : `${side} has not deposited funds`}
    </li>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="m4.75 8.25 2.25 2.25 4.25-4.5"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PendingCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2.75 2.75"
      />
    </svg>
  );
}

/**
 * Full address or transaction hash so it can be checked character by
 * character; marks the user's own address. Pass `copyLabel` to show a copy
 * button. `isSingleLine` keeps it on one line no wider than an address (42
 * characters), cutting out the middle with an ellipsis but always keeping the
 * last 4 characters, like `shortenAddress`; the full value stays in the
 * tooltip and the copy button.
 */
function AddressValue({
  address,
  copyLabel,
  isSingleLine = false,
}: {
  address: Address | Hash;
  copyLabel?: string;
  isSingleLine?: boolean;
}) {
  return (
    <span className="flex items-center gap-2 sm:justify-end">
      {isSingleLine ? (
        <span title={address} className="flex min-w-0 max-w-[42ch] font-mono">
          <span className="truncate">{address.slice(0, -4)}</span>
          <span className="shrink-0">{address.slice(-4)}</span>
        </span>
      ) : (
        <span className="min-w-0 font-mono break-all text-balance">
          {address}
          {address === currentUser && <span className="font-sans text-muted"> (you)</span>}
        </span>
      )}
      {copyLabel && <CopyButton value={address} label={copyLabel} />}
    </span>
  );
}
