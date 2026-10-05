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

export type TradeStepStatus = "complete" | "current" | "upcoming" | "failed";

type TradeStep = {
  label: string;
  /** The escrow states a trade can be in, or end in, at this step. */
  states: EscrowState[];
};

export const tradeSteps: TradeStep[] = [
  { label: "Create Trade", states: [] },
  { label: "Awaiting deposits", states: ["AWAITING_DEPOSIT", "TRADE_CANCELED"] },
  {
    label: "Awaiting item delivery from seller",
    states: ["AWAITING_DELIVERY", "ITEM_SENT", "ITEM_INCORRECT"],
  },
  { label: "Return deposits to both parties", states: ["ITEM_RECEIVED", "SETTLED"] },
];

/**
 * Where the trade sits in its four steps: creation, deposits, delivery, then
 * the escrow returning deposits. A trade that exists has been created, so the
 * first step is always complete. A wrong-item report fails the delivery step
 * and makes the return current while both sides settle; a canceled trade
 * stops at deposits.
 */
export function getTradeSteps(trade: Trade): TradeStepStatus[] {
  switch (trade.state) {
    case "AWAITING_DEPOSIT":
      return ["complete", "current", "upcoming", "upcoming"];
    case "AWAITING_DELIVERY":
    case "ITEM_SENT":
      return ["complete", "complete", "current", "upcoming"];
    case "ITEM_INCORRECT":
      return ["complete", "complete", "failed", "current"];
    case "ITEM_RECEIVED":
    case "SETTLED":
      return ["complete", "complete", "complete", "complete"];
    case "TRADE_CANCELED":
      return ["complete", "failed", "upcoming", "upcoming"];
  }
}

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

/** Mirrors `FEE_PERCENTAGE` in `Escrow`. */
const feePercentage = BigInt(1);

/**
 * What the escrow pays out when the buyer confirms the agreed item, all in
 * wei, mirroring `setBuyerHasReceivedCorrectItem`: the seller gets the item
 * price plus their deposit, the buyer gets their deposit minus the price, and
 * each side pays half of a 1% fee on the price out of that. Returns are
 * after the fee, so they match what each wallet received.
 */
export function getCompletedPayout(trade: Trade) {
  const totalFee = (trade.itemPrice * feePercentage) / BigInt(100);
  // The contract's `feePerParty` is the seller's half, rounded down; the
  // buyer pays the rest.
  const sellerFee = totalFee / BigInt(2);
  const buyerFee = totalFee - sellerFee;

  return {
    /** The item price, from the buyer's deposit to the seller. */
    paidToSeller: trade.itemPrice,
    returnedToSeller: getDeposit(trade, true) - sellerFee,
    returnedToBuyer: getDeposit(trade, false) - trade.itemPrice - buyerFee,
  };
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
 * Which side canceled a canceled trade. Only a side that deposited can cancel,
 * and a trade where both had deposited can't be, so it's the one that did.
 */
export function getCanceledBy(trade: Trade) {
  if (trade.state !== "TRADE_CANCELED") return undefined;
  return trade.hasSellerDeposited ? "Seller" : "Buyer";
}

/**
 * Once both deposits are locked, the seller hands over the item and marks it
 * delivered (the escrow's `setSellerHasGivenItem`).
 */
export function canMarkDelivered(trade: Trade, isSeller: boolean) {
  return isSeller && trade.state === "AWAITING_DELIVERY";
}

/**
 * Once the seller has marked the item delivered, the buyer either confirms
 * the agreed item arrived (the escrow's `setBuyerHasReceivedCorrectItem`,
 * which pays out) or reports a wrong or missing item
 * (`setBuyerHasReceivedIncorrectItem`, which returns 25% of the buyer's
 * deposit and locks the rest until both sides settle).
 */
export function canConfirmReceipt(trade: Trade, isSeller: boolean) {
  return !isSeller && trade.state === "ITEM_SENT";
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
