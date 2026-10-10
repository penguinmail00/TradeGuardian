import { getAddress, type Address, type Hash, type Hex } from "viem";

import { BackendApiError, backendRequest, getErrorDetail } from "@/lib/backend-api";
import type { Trade } from "@/lib/trades";

/** A trade as the backend returns it: lowercase addresses, wei as a string. */
type StoredTrade = {
  escrow: string;
  transactionHash: Hash;
  itemName: string;
  description: string;
  seller: string;
  buyer: string;
  itemPrice: string;
  createdAt: string;
  /** Whether the requested wallet archived it; null when none was given. */
  archived: boolean | null;
};

/**
 * The stored details plus placeholders for the on-chain state, which
 * `withEscrowState` fills in: the backend only stores what the escrow
 * doesn't.
 */
function toTrade(stored: StoredTrade): Trade {
  return {
    escrow: getAddress(stored.escrow),
    transactionHash: stored.transactionHash,
    itemName: stored.itemName,
    description: stored.description,
    seller: getAddress(stored.seller),
    buyer: getAddress(stored.buyer),
    itemPrice: BigInt(stored.itemPrice),
    state: "AWAITING_DEPOSIT",
    hasSellerDeposited: false,
    hasBuyerDeposited: false,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date(stored.createdAt),
  };
}

/** Trades per page of My Trades. Matches `DEFAULT_PAGE_SIZE` in tradeguardian-backend. */
export const tradesPageSize = 10;

/** Longest search the backend accepts. Matches the `q` limit in tradeguardian-backend. */
export const tradeSearchMaxLength = 200;

export type TradeListView = "trades" | "archived";
export type TradeSortOrder = "newest" | "oldest";

export type TradeListQuery = {
  view: TradeListView;
  sortOrder: TradeSortOrder;
  /** Matched against the item name, transaction ID, contract and counterparty. */
  search: string;
  /** From 1. */
  page: number;
};

export type TradePage = {
  trades: Trade[];
  /** Matching trades in `view`, across all pages. */
  total: number;
  /** Matching trades in each view, for the tabs. */
  counts: Record<TradeListView, number>;
};

/**
 * One page of the trades `account` created or added that match `search`:
 * unarchived, or archived with `view: "archived"`. The backend searches,
 * sorts and pages them.
 */
export async function fetchTrades(account: Address, query: TradeListQuery): Promise<TradePage> {
  const params = new URLSearchParams({
    address: account,
    view: query.view,
    sort: query.sortOrder,
    q: query.search,
    page: String(query.page),
    pageSize: String(tradesPageSize),
  });
  const response = await backendRequest(`/trades?${params}`);
  if (!response.ok) throw new BackendApiError(await getErrorDetail(response));
  const page: { trades: StoredTrade[]; total: number; counts: Record<TradeListView, number> } =
    await response.json();
  return { trades: page.trades.map(toTrade), total: page.total, counts: page.counts };
}

/**
 * The trade for an escrow, and whether `account` archived it (false without
 * an account), or undefined if none was saved.
 */
export async function fetchTrade(
  escrow: Address,
  account: Address | undefined,
): Promise<{ trade: Trade; isArchived: boolean } | undefined> {
  const response = await backendRequest(account ? `/trades/${escrow}?address=${account}` : `/trades/${escrow}`);
  if (response.status === 404) return undefined;
  if (!response.ok) throw new BackendApiError(await getErrorDetail(response));
  const stored: StoredTrade = await response.json();
  return { trade: toTrade(stored), isArchived: stored.archived === true };
}

/**
 * Saves the trade `transactionHash` created. The backend reads the escrow,
 * parties, price and creation time from the transaction, so only the item
 * details are sent. Resolves with the escrow's address, including when the
 * trade was already saved, so a retry succeeds.
 */
export async function saveTrade(input: {
  transactionHash: Hash;
  itemName: string;
  description: string;
}): Promise<{ ok: true; escrow?: Address } | { ok: false; message: string }> {
  const response = await backendRequest("/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.status === 409) return { ok: true };
  if (!response.ok) return { ok: false, message: await getErrorDetail(response) };
  const stored: StoredTrade = await response.json();
  return { ok: true, escrow: getAddress(stored.escrow) };
}

/**
 * Adds the trade to `account`'s list. `signature` is `account`'s signature of
 * `addTradeMessage` for this trade and `issuedAt`; the backend checks it and
 * that `account` is the buyer or seller. Adding a listed trade again succeeds.
 */
export async function addTradeToList(input: {
  escrow: Address;
  account: Address;
  issuedAt: string;
  signature: Hex;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await backendRequest(`/trades/${input.escrow}/members/${input.account}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issuedAt: input.issuedAt, signature: input.signature }),
  });
  if (!response.ok) return { ok: false, message: await getErrorDetail(response) };
  return { ok: true };
}

/**
 * Archives or unarchives the trade in `account`'s list. `signature` is
 * `account`'s signature of `archiveTradeMessage` for this trade, `archived`
 * and `issuedAt`; the backend checks it and that the trade is in the list.
 * Setting the current value again succeeds.
 */
export async function setTradeArchived(input: {
  escrow: Address;
  account: Address;
  archived: boolean;
  issuedAt: string;
  signature: Hex;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await backendRequest(`/trades/${input.escrow}/archived/${input.account}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archived: input.archived, issuedAt: input.issuedAt, signature: input.signature }),
  });
  if (!response.ok) return { ok: false, message: await getErrorDetail(response) };
  return { ok: true };
}
