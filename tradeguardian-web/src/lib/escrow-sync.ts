import { escrowAbi } from "@/lib/escrow-abi";
import { escrowFactoryChain } from "@/lib/escrow-factory";
import type { EscrowState, Trade } from "@/lib/trades";

/** `Escrow.EscrowState` in declaration order, so the index is the on-chain value. */
const escrowStates: readonly EscrowState[] = [
  "AWAITING_DEPOSIT",
  "AWAITING_DELIVERY",
  "ITEM_SENT",
  "ITEM_INCORRECT",
  "ITEM_RECEIVED",
  "SETTLED",
  "TRADE_CANCELED",
];

/** How many reads `getEscrowStateContracts` makes per trade. */
export const escrowStateReadCount = 5;

/**
 * The reads that give a trade's current state, in the order
 * `withEscrowState` expects: `currentState`, both deposits, and both settle
 * flags. Many trades' reads go in one `useReadContracts` call, so they're
 * batched into a single multicall.
 */
export function getEscrowStateContracts(trade: Trade) {
  const base = { address: trade.escrow, abi: escrowAbi, chainId: escrowFactoryChain.id } as const;
  return [
    { ...base, functionName: "currentState" },
    { ...base, functionName: "userBalances", args: [trade.seller] },
    { ...base, functionName: "userBalances", args: [trade.buyer] },
    { ...base, functionName: "hasSellerSettled" },
    { ...base, functionName: "hasBuyerSettled" },
  ] as const;
}

type ReadResult = { status: "success"; result: unknown } | { status: "failure"; error: Error };

/**
 * A copy of the stored trade with its escrow's `currentState` and deposits
 * from `results` (from `getEscrowStateContracts`). Keeps the stored values if
 * the escrow couldn't be read (e.g. the RPC is down).
 *
 * Deposits come from `userBalances` only while the trade awaits deposits;
 * after that both sides must have deposited, except on a canceled trade, whose
 * balances are emptied. The backend doesn't store deposits, so a canceled
 * trade shows neither side as having deposited.
 *
 * The settle flags are only public on escrows from the current factory; on
 * older ones those reads fail and the stored flags are kept.
 */
export function withEscrowState(trade: Trade, results: readonly ReadResult[] | undefined): Trade {
  const [state, sellerBalance, buyerBalance, hasSellerSettled, hasBuyerSettled] = results ?? [];
  if (state?.status !== "success" || sellerBalance?.status !== "success" || buyerBalance?.status !== "success") {
    return trade;
  }

  const escrowState = escrowStates[state.result as number];
  if (!escrowState) return trade;

  const synced = { ...trade, state: escrowState };
  if (escrowState === "AWAITING_DEPOSIT") {
    synced.hasSellerDeposited = (sellerBalance.result as bigint) > BigInt(0);
    synced.hasBuyerDeposited = (buyerBalance.result as bigint) > BigInt(0);
  } else if (escrowState !== "TRADE_CANCELED") {
    synced.hasSellerDeposited = true;
    synced.hasBuyerDeposited = true;
  }
  if (hasSellerSettled?.status === "success") synced.hasSellerSettled = hasSellerSettled.result as boolean;
  if (hasBuyerSettled?.status === "success") synced.hasBuyerSettled = hasBuyerSettled.result as boolean;
  return synced;
}
