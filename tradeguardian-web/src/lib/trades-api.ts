import { getAddress, type Address, type Hash } from "viem";

import type { Trade } from "@/lib/trades";

/**
 * tradeguardian-backend, which stores each trade's off-chain details. Server
 * only: the variable isn't `NEXT_PUBLIC_`, so it's undefined in the browser.
 */
const backendUrl = process.env.BACKEND_URL;

/** The backend couldn't be reached, isn't configured, or returned an error. */
export class TradesApiError extends Error {
  name = "TradesApiError";
}

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
};

async function request(path: string, init?: RequestInit) {
  if (!backendUrl) throw new TradesApiError("BACKEND_URL is not set.");
  try {
    return await fetch(`${backendUrl}${path}`, {
      ...init,
      // Trades change on every save, so never serve a cached response.
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new TradesApiError(`Couldn't reach the backend: ${error}`);
  }
}

/** FastAPI puts the reason in `detail`. */
async function getErrorDetail(response: Response) {
  const body = await response.json().catch(() => undefined);
  return typeof body?.detail === "string" ? body.detail : `The backend returned ${response.status}.`;
}

/**
 * The stored details plus placeholders for the on-chain state, which
 * `syncTradeFromChain` fills in: the backend only stores what the escrow
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

/** Trades where `account` is the seller or the buyer, newest first. */
export async function fetchTrades(account: Address): Promise<Trade[]> {
  const response = await request(`/trades?address=${account}`);
  if (!response.ok) throw new TradesApiError(await getErrorDetail(response));
  return ((await response.json()) as StoredTrade[]).map(toTrade);
}

/** The trade for an escrow, or undefined if none was saved. */
export async function fetchTrade(escrow: Address): Promise<Trade | undefined> {
  const response = await request(`/trades/${escrow}`);
  if (response.status === 404) return undefined;
  if (!response.ok) throw new TradesApiError(await getErrorDetail(response));
  return toTrade(await response.json());
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
  const response = await request("/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.status === 409) return { ok: true };
  if (!response.ok) return { ok: false, message: await getErrorDetail(response) };
  const stored: StoredTrade = await response.json();
  return { ok: true, escrow: getAddress(stored.escrow) };
}
