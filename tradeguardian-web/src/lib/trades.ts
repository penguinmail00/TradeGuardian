import type { Address, Hash } from "viem";

/** Mirrors `Escrow.EscrowState` in tradeguardian-contracts. */
export type EscrowState =
  | "AWAITING_DEPOSIT"
  | "AWAITING_DELIVERY"
  | "ITEM_SENT"
  | "ITEM_INCORRECT"
  | "ITEM_RECEIVED"
  | "SETTLED"
  | "TRADE_CANCELED";

export type Trade = {
  escrow: Address;
  /** Hash of the transaction that created the escrow. */
  transactionHash: Hash;
  itemName: string;
  /** Free text from the trade's creator; may contain line breaks. */
  description: string;
  seller: Address;
  buyer: Address;
  /** In wei. */
  itemPrice: bigint;
  state: EscrowState;
  /** Whether each side has locked its deposit, from the escrow's `userBalances`. */
  hasSellerDeposited: boolean;
  hasBuyerDeposited: boolean;
  /**
   * Whether each side has called the escrow's `settle` after an
   * incorrect-item report, like its `hasSellerSettled` and `hasBuyerSettled`.
   */
  hasSellerSettled: boolean;
  hasBuyerSettled: boolean;
  /** From the escrow's `contractCreationDate` (block timestamp, in seconds). */
  createdAt: Date;
};

type TradeStatus = {
  label: string;
  /** One sentence on where the trade stands, shown on the trade page. */
  description: string;
  /** Badge colors. */
  className: string;
};

export const tradeStatuses: Record<EscrowState, TradeStatus> = {
  AWAITING_DEPOSIT: {
    label: "Awaiting deposits",
    description: "Waiting for both sides to lock their deposits in escrow.",
    className: "bg-tint-gold text-gold",
  },
  AWAITING_DELIVERY: {
    label: "Awaiting delivery",
    description: "Both deposits are locked. The seller can now hand over the item.",
    className: "bg-tint-blue text-blue",
  },
  ITEM_SENT: {
    label: "Item delivered",
    description:
      "The seller has marked the item as delivered. Waiting for the buyer to confirm.",
    className: "bg-tint-purple text-purple",
  },
  ITEM_INCORRECT: {
    label: "Incorrect or no item",
    description:
      "The buyer reported receiving the wrong item, or no item at all, so both deposits stay locked.",
    className: "bg-danger/10 text-danger",
  },
  // The contract's success state: confirming the item pays out the escrow,
  // and nothing can happen after it.
  ITEM_RECEIVED: {
    label: "Completed",
    description:
      "The buyer confirmed they received the agreed item, and the escrow paid out to both sides.",
    className: "bg-tint-green text-green",
  },
  // Only reached from ITEM_INCORRECT, once both sides agree to release the
  // remaining deposits.
  SETTLED: {
    label: "Settled",
    description:
      "Both sides settled the wrong-item report, and the remaining deposits were returned.",
    className: "bg-border/40 text-muted",
  },
  TRADE_CANCELED: {
    label: "Canceled",
    description: "This trade was canceled.",
    className: "bg-border/40 text-muted",
  },
};

/**
 * Only finished trades can be archived, so a trade that still needs action
 * can't be hidden by accident.
 */
export function canArchive(trade: Trade) {
  return (
    trade.state === "ITEM_RECEIVED" ||
    trade.state === "SETTLED" ||
    trade.state === "TRADE_CANCELED"
  );
}

/** Sellers deposit 1x the item price; buyers deposit 2x. */
export function getDeposit(trade: Trade, isSeller: boolean) {
  return isSeller ? trade.itemPrice : trade.itemPrice * BigInt(2);
}

/**
 * While the escrow is awaiting deposits, each side deposits once. True when
 * it's this side's turn to deposit.
 */
export function needsDeposit(trade: Trade, isSeller: boolean) {
  if (trade.state !== "AWAITING_DEPOSIT") return false;
  return isSeller ? !trade.hasSellerDeposited : !trade.hasBuyerDeposited;
}

/** Mirrors `TWO_HOURS_IN_SECS` in `Escrow`. */
const depositWindowMs = 2 * 60 * 60 * 1000;

/**
 * When the deposit window closes, like the escrow's
 * `deadlineForInitialDeposits`: two hours after creation. After it, a side
 * that deposited can withdraw and cancel the trade.
 */
export function getExpiration(trade: Trade) {
  return new Date(trade.createdAt.getTime() + depositWindowMs);
}

/**
 * True once the deposit window has closed with the trade still awaiting
 * deposits. Later states don't expire: the deadline only applies to deposits.
 */
export function isExpired(trade: Trade, nowMs: number) {
  return trade.state === "AWAITING_DEPOSIT" && nowMs >= getExpiration(trade).getTime();
}

/**
 * Once the deposit window has expired with the trade still awaiting deposits,
 * a side that deposited can cancel the trade and get its deposit back (the
 * escrow's `withdraw`). A side with nothing deposited has nothing to withdraw.
 */
export function canCancel(trade: Trade, isSeller: boolean, nowMs: number) {
  if (!isExpired(trade, nowMs)) return false;
  return isSeller ? trade.hasSellerDeposited : trade.hasBuyerDeposited;
}

/**
 * After an incorrect-item report, each side settles once (the escrow's
 * `settle`). Once both have, the escrow returns the remaining deposits.
 */
export function canSettle(trade: Trade, isSeller: boolean) {
  if (trade.state !== "ITEM_INCORRECT") return false;
  return isSeller ? !trade.hasSellerSettled : !trade.hasBuyerSettled;
}

/** `0x5B38…ddC4`. Also used for transaction hashes. */
export function shortenAddress(address: Address | Hash) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
