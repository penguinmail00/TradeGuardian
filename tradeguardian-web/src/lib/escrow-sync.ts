import { createPublicClient, http } from "viem";

import { escrowAbi } from "@/lib/escrow-abi";
import { escrowFactoryChain } from "@/lib/escrow-factory";
import type { EscrowState, Trade } from "@/lib/trades";

const publicClient = createPublicClient({ chain: escrowFactoryChain, transport: http() });

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

/**
 * Updates a stored trade in place with its escrow's `currentState` and
 * deposits, so the page reflects transactions sent since it was saved. Keeps
 * the stored values if the escrow can't be read (e.g. the RPC is down).
 *
 * Deposits come from `userBalances` only while the trade awaits deposits;
 * after that both sides must have deposited, except on a canceled trade, whose
 * balances are emptied. The backend doesn't store deposits, so a canceled
 * trade shows neither side as having deposited.
 *
 * The settle flags are only public on escrows from the current factory; on
 * older ones those reads fail and the stored flags are kept.
 */
export async function syncTradeFromChain(trade: Trade): Promise<Trade> {
  const [state, sellerBalance, buyerBalance, hasSellerSettled, hasBuyerSettled] = await publicClient.multicall({
    contracts: [
      { address: trade.escrow, abi: escrowAbi, functionName: "currentState" },
      { address: trade.escrow, abi: escrowAbi, functionName: "userBalances", args: [trade.seller] },
      { address: trade.escrow, abi: escrowAbi, functionName: "userBalances", args: [trade.buyer] },
      { address: trade.escrow, abi: escrowAbi, functionName: "hasSellerSettled" },
      { address: trade.escrow, abi: escrowAbi, functionName: "hasBuyerSettled" },
    ],
  }).catch(() => []);
  if (state?.status !== "success" || sellerBalance?.status !== "success" || buyerBalance?.status !== "success") {
    return trade;
  }

  const escrowState = escrowStates[state.result];
  if (!escrowState) return trade;

  trade.state = escrowState;
  if (escrowState === "AWAITING_DEPOSIT") {
    trade.hasSellerDeposited = sellerBalance.result > BigInt(0);
    trade.hasBuyerDeposited = buyerBalance.result > BigInt(0);
  } else if (escrowState !== "TRADE_CANCELED") {
    trade.hasSellerDeposited = true;
    trade.hasBuyerDeposited = true;
  }
  if (hasSellerSettled?.status === "success") trade.hasSellerSettled = hasSellerSettled.result;
  if (hasBuyerSettled?.status === "success") trade.hasBuyerSettled = hasBuyerSettled.result;
  return trade;
}
