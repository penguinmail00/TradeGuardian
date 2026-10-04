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
    label: "Item sent",
    description:
      "The seller has marked the item as delivered. Waiting for the buyer to confirm.",
    className: "bg-tint-purple text-purple",
  },
  ITEM_INCORRECT: {
    label: "Wrong item reported",
    description:
      "The buyer reported receiving the wrong item, so both deposits stay locked.",
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

/** `0x5B38…ddC4`. Also used for transaction hashes. */
export function shortenAddress(address: Address | Hash) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
