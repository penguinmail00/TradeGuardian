import { isAddressEqual, type Address, type Hash } from "viem";

import { saveTrade, TradesApiError } from "@/lib/trades-api";

import type { ItemDetails } from "./create-trade";

/**
 * Saves a trade the browser just created through the factory. Only the item
 * name and description are sent; the backend reads the escrow, addresses,
 * price and date from the transaction's `EscrowCreated` event, so a trade can
 * only be saved for an escrow the factory really created.
 */
export async function saveCreatedTrade(input: {
  transactionHash: Hash;
  escrow: Address;
  details: ItemDetails;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let saved;
  try {
    saved = await saveTrade({ transactionHash: input.transactionHash, ...input.details });
  } catch (error) {
    if (!(error instanceof TradesApiError)) throw error;
    return { ok: false, message: "Couldn't reach the server. Try again in a moment." };
  }
  if (!saved.ok) return saved;
  // The form opens `input.escrow` next, so it must be the escrow saved.
  if (saved.escrow && !isAddressEqual(saved.escrow, input.escrow)) {
    return { ok: false, message: "That transaction didn't create this trade." };
  }
  return { ok: true };
}
