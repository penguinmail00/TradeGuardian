"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore, type ComponentProps, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { formatEther, isAddressEqual, type Address } from "viem";
import { useAccount } from "wagmi";

import { CopyButton } from "@/components/trades/copy-button";
import { Placeholder } from "@/components/trades/placeholder";
import { TradeStatusBadge } from "@/components/trades/trade-status-badge";
import { TradeTimeCell } from "@/components/trades/trade-time";
import { useArchivedTrades } from "@/lib/archived-trades";
import { shortenAddress, untitledTradeName, type Trade } from "@/lib/trades";
import { useMyTrades } from "@/lib/use-trades";

type SortOrder = "newest" | "oldest";
type TradeView = "trades" | "archived";

/** Everything the URL controls; links change one field and keep the rest. */
type ListParams = { view: TradeView; sortOrder: SortOrder; search: string };

function parseListParams(searchParams: URLSearchParams): ListParams {
  return {
    view: searchParams.get("view") === "archived" ? "archived" : "trades",
    sortOrder: searchParams.get("sort") === "oldest" ? "oldest" : "newest",
    search: searchParams.get("q")?.trim() ?? "",
  };
}

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
function matchesSearch(trade: Trade, account: Address, search: string) {
  if (!search) return true;
  const needle = search.toLowerCase();
  const counterparty = getCounterparty(trade, account);
  return [trade.itemName, trade.transactionHash, trade.escrow, counterparty].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

/**
 * Shows a new list view without a server round trip: the URL changes through
 * the History API, which `useSearchParams` follows, and the list re-renders
 * from the trades already loaded.
 */
function showListView(params: ListParams) {
  window.history.pushState(null, "", tradesHref(params));
}

/**
 * A link to another view of the list. A plain click switches in the browser
 * (`showListView`); modified clicks (new tab, etc.) follow the real href.
 */
function ListViewLink({
  params,
  children,
  ...props
}: { params: ListParams; children: ReactNode } & Omit<ComponentProps<"a">, "href" | "onClick">) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showListView(params);
  }

  return (
    <a href={tradesHref(params)} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function subscribeToNothing() {
  return () => {};
}

/**
 * Lists the connected wallet's trades (where it's the seller or buyer) in two
 * tabs, unarchived and archived (`?view=archived`), sorted by creation date
 * (`?sort=oldest`, newest by default) and filtered by item name or address
 * (`?q=`). Loads the trades in the browser and switches tabs, sorting and
 * search there too, keeping the URL in sync.
 */
export function MyTradesList() {
  const params = parseListParams(useSearchParams());
  const { address: account, status } = useAccount();
  // wagmi starts disconnected and reconnects the stored wallet after mount, so
  // until then "no wallet" isn't known yet.
  const isMounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const isWalletPending = !isMounted || status === "connecting" || status === "reconnecting";
  const { trades: myTrades = [], isLoading, isError, loadedAt } = useMyTrades(account);
  const { isArchived } = useArchivedTrades(account);

  if (isWalletPending || (account && isLoading)) return <TradeListPlaceholder />;

  const sortedTrades = myTrades
    .filter((trade) => account && matchesSearch(trade, account, params.search))
    .toSorted((a, b) =>
    params.sortOrder === "newest"
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const unarchivedTrades = sortedTrades.filter((trade) => !isArchived(trade));
  const archivedTrades = sortedTrades.filter(isArchived);
  const shownTrades = params.view === "archived" ? archivedTrades : unarchivedTrades;

  return (
        <>
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
          {!account ? (
            <p className="type-body text-muted">Connect your wallet to see your trades.</p>
          ) : isError ? (
            <p className="type-body text-muted">Your trades couldn’t be loaded. Refresh the page to try again.</p>
          ) : shownTrades.length > 0 ? (
            <TradeList trades={shownTrades} account={account} params={params} now={loadedAt} />
          ) : params.search ? (
            <p className="type-body text-muted">
              No trades match “{params.search}”.{" "}
              <ListViewLink
                params={{ ...params, search: "" }}
                className="text-foreground underline underline-offset-4"
              >
                Clear search
              </ListViewLink>
            </p>
          ) : params.view === "archived" ? (
            <p className="type-body text-muted">No archived trades.</p>
          ) : (
            <p className="type-body text-muted">
              {archivedTrades.length > 0 ? "All your trades are archived." : "You don’t have any trades yet. Create a trade or add one someone shared with you."}
            </p>
          )}
        </>
  );
}

const placeholderRowCount = 4;

/**
 * Stands in for the tabs, search and list while the wallet reconnects and the
 * trades load, in the same places as the loaded list.
 */
export function TradeListPlaceholder() {
  return (
    <div role="status" aria-label="Loading your trades" className="motion-safe:animate-pulse">
      <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:border-b lg:border-border">
        <div className="flex gap-6 border-b border-border pb-3 lg:border-b-0">
          <Placeholder className="h-5 w-24" />
          <Placeholder className="h-5 w-24" />
        </div>
        <Placeholder className="h-11 w-full sm:max-w-md lg:mb-1.5 lg:h-9" />
      </div>
      <div className="panel">
        <div className="border-b border-border px-4 py-3 lg:px-6">
          <Placeholder className="h-4 w-1/3" />
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: placeholderRowCount }, (_, index) => (
            <li key={index} className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
              <Placeholder className="h-5 w-2/5 md:w-1/4" />
              <Placeholder className="h-6 w-28 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
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
              <ListViewLink
                params={{ ...params, view: tab.view }}
                aria-current={isCurrent ? "page" : undefined}
                className={`type-body -mb-px block border-b-2 pb-3 font-medium transition-colors ${
                  isCurrent
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label} <span className="text-muted">({counts[tab.view]})</span>
              </ListViewLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Searches on submit (Enter), keeping the current tab and sort. Handled in
 * the browser, so it filters the loaded trades without a server round trip.
 */
function SearchForm({ params }: { params: ListParams }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    showListView({ ...params, search });
  }

  return (
    <form action="/trades" role="search" onSubmit={handleSubmit} className="w-full sm:max-w-md lg:pb-1.5">
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
          // Re-keyed so going back or forward shows that view's search.
          key={params.search}
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
  account,
  params,
  now,
}: {
  trades: Trade[];
  account: Address;
  params: ListParams;
  now: number;
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
              <TradeRow trade={trade} account={account} now={now} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/**
 * Toggles between newest and oldest first, in the browser, so re-sorting
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
    <ListViewLink
      params={{ ...params, sortOrder: isNewest ? "oldest" : "newest" }}
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
    </ListViewLink>
  );
}

/** The other side of one of `account`'s trades. */
function getCounterparty(trade: Trade, account: Address) {
  return isAddressEqual(trade.seller, account) ? trade.buyer : trade.seller;
}

function TradeRow({ trade, account, now }: { trade: Trade; account: Address; now: number }) {
  const isSeller = isAddressEqual(trade.seller, account);
  const counterparty = getCounterparty(trade, account);
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
        now={now}
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
