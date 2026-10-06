import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatEther } from "viem";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { CopyButton } from "@/components/trades/copy-button";
import { TradeStatusBadge } from "@/components/trades/trade-status-badge";
import { TradeTimeCell } from "@/components/trades/trade-time";
import { currentUser, isArchived, trades } from "@/lib/fake-trades";
import { getRequestTime } from "@/lib/request-time";
import { shortenAddress, untitledTradeName, type Trade } from "@/lib/trades";

export const metadata: Metadata = {
  title: "My Trades | TradeGuardian",
  description: "Track the status of every trade you are buying or selling.",
};

type SortOrder = "newest" | "oldest";
type TradeView = "trades" | "archived";

/** Everything the URL controls; links change one field and keep the rest. */
type ListParams = { view: TradeView; sortOrder: SortOrder; search: string };

/** `/trades`, `/trades?view=archived&sort=oldest&q=0x12`, … (defaults are omitted). */
function tradesHref({ view, sortOrder, search }: ListParams) {
  const query = new URLSearchParams();
  if (view === "archived") query.set("view", "archived");
  if (sortOrder === "oldest") query.set("sort", "oldest");
  if (search) query.set("q", search);
  const queryString = query.toString();
  return queryString ? `/trades?${queryString}` : "/trades";
}

/**
 * Case-insensitive partial match on the item name, full transaction ID,
 * contract address or counterparty address, so a word from the name, a pasted
 * value or just its first few characters all work.
 */
function matchesSearch(trade: Trade, search: string) {
  if (!search) return true;
  const needle = search.toLowerCase();
  const counterparty = trade.seller === currentUser ? trade.buyer : trade.seller;
  return [trade.itemName, trade.transactionHash, trade.escrow, counterparty].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

/**
 * Lists the connected wallet's trades in two tabs, unarchived and archived
 * (`?view=archived`), sorted by creation date (`?sort=oldest`, newest by
 * default) and filtered by item name or address (`?q=`). Rendered entirely on the server.
 */
export default async function MyTradesPage({ searchParams }: PageProps<"/trades">) {
  const { sort, view, q } = await searchParams;
  const params: ListParams = {
    view: view === "archived" ? "archived" : "trades",
    sortOrder: sort === "oldest" ? "oldest" : "newest",
    search: typeof q === "string" ? q.trim() : "",
  };
  const sortedTrades = trades
    .filter((trade) => matchesSearch(trade, params.search))
    .toSorted((a, b) =>
    params.sortOrder === "newest"
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const unarchivedTrades = sortedTrades.filter((trade) => !isArchived(trade));
  const archivedTrades = sortedTrades.filter(isArchived);
  const shownTrades = params.view === "archived" ? archivedTrades : unarchivedTrades;
  // Ages are measured from the request time.
  const serverNow = getRequestTime();

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <TradesIntro />
        <div className="mx-auto w-[calc(100%-60px)] max-w-[1140px] pb-16 lg:pb-24">
          {/* From lg up, tabs and search share one bar above a single divider;
              below that the search drops under the tabs. */}
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:border-b lg:border-border">
            <div className="flex items-end justify-between gap-4 border-b border-border lg:border-b-0">
              <ViewTabs
                params={params}
                counts={{ trades: unarchivedTrades.length, archived: archivedTrades.length }}
              />
              {/* The Age column, and its sort arrow, only shows from lg up. */}
              {shownTrades.length > 1 && (
                <SortLink params={params} className="type-small flex pb-3 text-muted lg:hidden">
                  {params.sortOrder === "newest" ? "Newest first" : "Oldest first"}
                </SortLink>
              )}
            </div>
            <SearchForm params={params} />
          </div>
          {shownTrades.length > 0 ? (
            <TradeList trades={shownTrades} params={params} serverNow={serverNow} />
          ) : params.search ? (
            <p className="type-body text-muted">
              No trades match “{params.search}”.{" "}
              <Link
                href={tradesHref({ ...params, search: "" })}
                scroll={false}
                className="text-foreground underline underline-offset-4"
              >
                Clear search
              </Link>
            </p>
          ) : params.view === "archived" ? (
            <p className="type-body text-muted">No archived trades.</p>
          ) : (
            <NoTrades hasArchivedTrades={archivedTrades.length > 0} />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function TradesIntro() {
  return (
    <section className="pt-(--header-height)">
      <div className="mx-auto flex w-[calc(100%-60px)] max-w-[1140px] flex-col gap-6 pt-16 pb-12 sm:flex-row sm:items-center sm:justify-between lg:pt-24 lg:pb-16">
        <div>
          <h1 className="type-h1 text-balance">My trades</h1>
        </div>
        <TradeActions />
      </div>
    </section>
  );
}

function ViewTabs({
  params,
  counts,
}: {
  params: ListParams;
  counts: Record<TradeView, number>;
}) {
  const tabs: { view: TradeView; label: string }[] = [
    { view: "trades", label: "Trades" },
    { view: "archived", label: "Archived" },
  ];

  return (
    <nav aria-label="Trade lists">
      <ul className="flex gap-6">
        {tabs.map((tab) => {
          const isCurrent = tab.view === params.view;
          return (
            <li key={tab.view}>
              <Link
                href={tradesHref({ ...params, view: tab.view })}
                scroll={false}
                aria-current={isCurrent ? "page" : undefined}
                className={`type-body -mb-px block border-b-2 pb-3 font-medium transition-colors ${
                  isCurrent
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label} <span className="text-muted">({counts[tab.view]})</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Plain GET form, so searching works before hydration. Hidden fields carry the
 * current tab and sort so a new search keeps them.
 */
function SearchForm({ params }: { params: ListParams }) {
  return (
    <form action="/trades" role="search" className="w-full sm:max-w-md lg:pb-1.5">
      {params.view === "archived" && <input type="hidden" name="view" value="archived" />}
      {params.sortOrder === "oldest" && <input type="hidden" name="sort" value="oldest" />}
      <label htmlFor="trade-search" className="sr-only">
        Search by item name, transaction ID, contract address or counterparty
      </label>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="trade-search"
          type="search"
          name="q"
          defaultValue={params.search}
          placeholder="Search for item, transaction ID, or address"
          autoComplete="off"
          spellCheck={false}
          className="field pl-10 font-mono placeholder:font-sans lg:min-h-0 lg:border-transparent lg:py-[7px]"
        />
      </div>
    </form>
  );
}

function TradeList({
  trades,
  params,
  serverNow,
}: {
  trades: Trade[];
  params: ListParams;
  serverNow: number;
}) {
  return (
    <>
      {/* Rows are links, so this is a subgrid list rather than a table: each
          row spans every column and shares the panel's tracks. From md up,
          columns fit their content and the spare width goes between them.
          Columns run from what people scan for (which trade, and whether it
          needs them) to what they check least, with the price on the right
          edge for comparing amounts: Item, Status, Age, Counterparty, Item price.
          Tablets drop Age, and phones keep only Item and Status. */}
      <div className="panel type-small grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 md:grid-cols-[repeat(4,auto)] md:justify-between md:gap-x-6 lg:grid-cols-[repeat(5,auto)] lg:gap-x-8">
        <div className="col-span-full grid grid-cols-subgrid border-b border-border px-4 py-3 font-medium text-muted lg:px-6">
          <span>Item</span>
          <span className="text-right md:text-left">Status</span>
          <SortLink params={params} className="hidden lg:flex">
            Age
          </SortLink>
          <span className="hidden md:block">Counterparty</span>
          <span className="hidden text-right md:block">Item price</span>
        </div>
        <ul className="col-span-full grid grid-cols-subgrid divide-y divide-border">
          {trades.map((trade) => (
            <li key={trade.escrow} className="col-span-full grid grid-cols-subgrid">
              <TradeRow trade={trade} serverNow={serverNow} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/**
 * Toggles between newest and oldest first. Uses `scroll={false}` so re-sorting
 * keeps the reader's place on the page.
 */
function SortLink({
  params,
  className,
  children,
}: {
  params: ListParams;
  className: string;
  /** Omit for an arrow-only link. */
  children?: ReactNode;
}) {
  const isNewest = params.sortOrder === "newest";

  return (
    <Link
      href={tradesHref({ ...params, sortOrder: isNewest ? "oldest" : "newest" })}
      scroll={false}
      aria-label={`Sorted by created date, ${params.sortOrder} first. Sort ${isNewest ? "oldest" : "newest"} first`}
      className={`items-center gap-1 transition-colors hover:text-foreground focus-visible:text-foreground ${className}`}
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`size-3.5 transition-transform ${isNewest ? "" : "rotate-180"}`}
      >
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </Link>
  );
}

function NoTrades({ hasArchivedTrades }: { hasArchivedTrades: boolean }) {
  return (
    <div className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
      <div>
        <h2 className="type-h3">
          {hasArchivedTrades ? "All your trades are archived" : "No trades yet"}
        </h2>
        <p className="type-body mt-2 text-muted">
          Start a trade and invite the other side with its escrow address.
        </p>
      </div>
      <TradeActions />
    </div>
  );
}

/** Create a new trade, or add one the other side created. Stacked on phones, Create on top. */
function TradeActions() {
  return (
    <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
      <Link href="/trades/create" className="btn btn-primary w-full sm:w-auto">
        Create a trade
      </Link>
      <Link href="/trades/new" className="btn btn-secondary w-full sm:w-auto">
        Add a trade
      </Link>
    </div>
  );
}

function TradeRow({ trade, serverNow }: { trade: Trade; serverNow: number }) {
  const isSeller = trade.seller === currentUser;
  const counterparty = isSeller ? trade.buyer : trade.seller;
  const price = `${formatEther(trade.itemPrice)} MON`;

  // The item name link stretches over the whole row (`after:inset-0`) so any
  // part of the row opens the trade; the counterparty's copy button sits above
  // it, since a button can't be nested inside a link.
  return (
    <div className="relative col-span-full grid grid-cols-subgrid items-center px-4 py-4 transition-colors hover:bg-input has-[a:focus-visible]:bg-input lg:px-6">
      {/* Phones have no Item price column, so the price sits under the item
          name. */}
      <span className="min-w-0">
        <Link
          href={`/trades/${trade.escrow}`}
          className={`block truncate font-medium after:absolute after:inset-0 md:max-w-[28ch] ${
            trade.itemName ? "" : "text-muted"
          }`}
        >
          {trade.itemName || untitledTradeName}
        </Link>
        <span className="block text-muted md:hidden">{price}</span>
      </span>
      <span className="text-right md:text-left">
        <TradeStatusBadge state={trade.state} />
      </span>
      <TradeTimeCell
        dateTime={trade.createdAt.toISOString()}
        serverNow={serverNow}
        className="hidden whitespace-nowrap text-muted lg:block"
      />
      <span className="hidden items-center gap-1 md:flex">
        <span className="font-mono">{shortenAddress(counterparty)}</span>
        <CopyButton
          value={counterparty}
          label={`Copy ${isSeller ? "buyer" : "seller"} address`}
          className="relative -my-2"
        />
      </span>
      <span className="hidden whitespace-nowrap text-right md:block">{price}</span>
    </div>
  );
}
