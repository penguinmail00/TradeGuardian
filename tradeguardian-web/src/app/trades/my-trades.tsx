"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useSyncExternalStore,
  type ComponentProps,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { formatEther, isAddressEqual, type Address } from "viem";
import { useAccount } from "wagmi";

import { CopyButton } from "@/components/trades/copy-button";
import { Placeholder } from "@/components/trades/placeholder";
import { TradeStatusBadge } from "@/components/trades/trade-status-badge";
import { TradeTimeCell } from "@/components/trades/trade-time";
import { shortenAddress, untitledTradeName, type Trade } from "@/lib/trades";
import { tradeSearchMaxLength, tradesPageSize, type TradeListQuery, type TradeListView } from "@/lib/trades-api";
import { useMyTrades } from "@/lib/use-trades";

/**
 * Everything the URL controls; links change one field and keep the rest.
 * Changing the tab, sort or search goes back to the first page.
 */
type ListParams = TradeListQuery;

function parseListParams(searchParams: URLSearchParams): ListParams {
  const page = Number(searchParams.get("page"));
  return {
    view: searchParams.get("view") === "archived" ? "archived" : "trades",
    sortOrder: searchParams.get("sort") === "oldest" ? "oldest" : "newest",
    // Cut to what the backend accepts, in case a link carries a longer one.
    search: searchParams.get("q")?.trim().slice(0, tradeSearchMaxLength) ?? "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** `/trades`, `/trades?view=archived&sort=oldest&q=0x12&page=2`, … (defaults are omitted). */
function tradesHref({ view, sortOrder, search, page }: ListParams) {
  const query = new URLSearchParams();
  if (view === "archived") query.set("view", "archived");
  if (sortOrder === "oldest") query.set("sort", "oldest");
  if (search) query.set("q", search);
  if (page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `/trades?${queryString}` : "/trades";
}

/**
 * Shows a new list view without loading a new page: the URL changes through
 * the History API, which `useSearchParams` follows, and the list fetches that
 * view from the backend.
 */
function showListView(params: ListParams, { scrollToTop = false } = {}) {
  window.history.pushState(null, "", tradesHref(params));
  if (scrollToTop) window.scrollTo({ top: 0 });
}

/**
 * A link to another view of the list. A plain click switches in the browser
 * (`showListView`); modified clicks (new tab, etc.) follow the real href.
 */
function ListViewLink({
  params,
  scrollToTop,
  children,
  ...props
}: { params: ListParams; scrollToTop?: boolean; children: ReactNode } & Omit<
  ComponentProps<"a">,
  "href" | "onClick"
>) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showListView(params, { scrollToTop });
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
 * Lists the trades the connected wallet created or added in two tabs,
 * unarchived and archived (`?view=archived`), sorted by creation date
 * (`?sort=oldest`, newest by default), filtered by item name or address
 * (`?q=`) and split into pages (`?page=`). The backend searches, sorts and
 * pages; switching any of them keeps the URL in sync and shows the current
 * page until the next one loads.
 */
export function MyTradesList() {
  const params = parseListParams(useSearchParams());
  const { address: account, status } = useAccount();
  // wagmi starts disconnected and reconnects the stored wallet after mount, so
  // until then "no wallet" isn't known yet.
  const isMounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const isWalletPending = !isMounted || status === "connecting" || status === "reconnecting";
  const { page, isLoading, isPlaceholderData, isError, loadedAt } = useMyTrades(account, params);
  const pageCount = Math.max(1, Math.ceil((page?.total ?? 0) / tradesPageSize));
  // Past the last page (e.g. after archiving its only trade, or from an old
  // link), go to the last one instead of showing an empty page.
  const isPastLastPage = Boolean(page && !isPlaceholderData && params.page > pageCount);
  useEffect(() => {
    if (isPastLastPage) window.history.replaceState(null, "", tradesHref({ ...params, page: pageCount }));
  });

  const shownTrades = page?.trades ?? [];
  // A previous view with no trades says nothing about the one loading, so
  // that waits for the load instead of showing its empty message.
  const isLoadingFromEmpty = isPlaceholderData && shownTrades.length === 0;
  if (isWalletPending || (account && (isLoading || isPastLastPage || isLoadingFromEmpty))) {
    return <TradeListPlaceholder />;
  }

  const counts = page?.counts ?? { trades: 0, archived: 0 };

  return (
        <>
          {/* From lg up, tabs and search share one bar above a single divider;
              below that the search drops under the tabs. */}
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:border-b lg:border-border">
            <div className="flex items-end justify-between gap-4 border-b border-border lg:border-b-0">
              <ViewTabs
                params={params}
                counts={counts}
              />
              {/* The Age column, and its sort arrow, only shows from lg up. */}
              {(page?.total ?? 0) > 1 && (
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
            // Dimmed while the next view loads in its place.
            <div
              aria-busy={isPlaceholderData}
              className={`transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}
            >
              <TradeList trades={shownTrades} account={account} params={params} now={loadedAt} />
              <Pagination params={params} pageCount={pageCount} total={page?.total ?? 0} />
            </div>
          ) : params.search ? (
            <p className="type-body text-muted">
              No trades match “{params.search}”.{" "}
              <ListViewLink
                params={{ ...params, search: "", page: 1 }}
                className="text-foreground underline underline-offset-4"
              >
                Clear search
              </ListViewLink>
            </p>
          ) : params.view === "archived" ? (
            <p className="type-body text-muted">No archived trades.</p>
          ) : (
            <p className="type-body text-muted">
              {counts.archived > 0 ? "All your trades are archived." : "You don’t have any trades yet. Create a trade or add one someone shared with you."}
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
  counts: Record<TradeListView, number>;
}) {
  const tabs: { view: TradeListView; label: string }[] = [
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
                params={{ ...params, view: tab.view, page: 1 }}
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
 * Searches on submit (Enter), keeping the current tab and sort and going back
 * to the first page. The backend matches the search (see `fetchTrades`).
 */
function SearchForm({ params }: { params: ListParams }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    showListView({ ...params, search, page: 1 });
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
          maxLength={tradeSearchMaxLength}
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
 * Toggles between newest and oldest first, from the first page, without
 * loading a new page, so re-sorting keeps the reader's scroll position.
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
      params={{ ...params, sortOrder: isNewest ? "oldest" : "newest", page: 1 }}
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

/**
 * The page numbers to link to: the first, the last, and the current one with
 * its neighbors, with null where a gap is left out (1 … 4 5 6 … 12).
 */
function getPageNumbers(page: number, pageCount: number) {
  const shown = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((number) => number >= 1 && number <= pageCount)
    .toSorted((a, b) => a - b);
  return shown.flatMap((number, index) => {
    const previous = shown[index - 1];
    if (previous === undefined || number === previous + 1) return [number];
    // A gap of one page shows that page rather than an ellipsis.
    return number === previous + 2 ? [previous + 1, number] : [null, number];
  });
}

/**
 * "11–20 of 53" and links to the previous, next and nearby pages, keeping
 * the tab, sort and search. Hidden when everything fits on one page.
 */
function Pagination({ params, pageCount, total }: { params: ListParams; pageCount: number; total: number }) {
  if (pageCount <= 1) return null;
  const first = (params.page - 1) * tradesPageSize + 1;
  const last = Math.min(params.page * tradesPageSize, total);
  const linkClassName =
    "flex min-w-9 items-center justify-center rounded-md px-2 py-1.5 transition-colors hover:bg-input hover:text-foreground";

  return (
    <nav
      aria-label="Pages"
      className="type-small mt-6 flex flex-col items-center gap-4 text-muted sm:flex-row sm:justify-between"
    >
      <p>
        {first}–{last} of {total}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          {params.page > 1 ? (
            <ListViewLink params={{ ...params, page: params.page - 1 }} scrollToTop className={linkClassName}>
              Previous
            </ListViewLink>
          ) : (
            <span aria-disabled="true" className={`${linkClassName} pointer-events-none opacity-50`}>
              Previous
            </span>
          )}
        </li>
        {getPageNumbers(params.page, pageCount).map((number, index) => (
          <li key={number ?? `gap-${index}`} className="hidden sm:block">
            {number === null ? (
              <span className="px-1">…</span>
            ) : (
              <ListViewLink
                params={{ ...params, page: number }}
                scrollToTop
                aria-label={`Page ${number}`}
                aria-current={number === params.page ? "page" : undefined}
                className={`${linkClassName} ${number === params.page ? "bg-input font-medium text-foreground" : ""}`}
              >
                {number}
              </ListViewLink>
            )}
          </li>
        ))}
        <li className="px-2 sm:hidden">
          Page {params.page} of {pageCount}
        </li>
        <li>
          {params.page < pageCount ? (
            <ListViewLink params={{ ...params, page: params.page + 1 }} scrollToTop className={linkClassName}>
              Next
            </ListViewLink>
          ) : (
            <span aria-disabled="true" className={`${linkClassName} pointer-events-none opacity-50`}>
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
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
