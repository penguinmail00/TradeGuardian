"use server";

import { revalidatePath } from "next/cache";
import { isAddress, isAddressEqual, isHash, type Address, type Hash } from "viem";

import { saveTrade, TradesApiError } from "@/lib/trades-api";

import { type ItemDetails, itemDetailsSchema } from "./create-trade";

/**
 * Saves a trade the browser just created through the factory. Only the item
 * name and description are taken from the client; the backend reads the
 * escrow, addresses, price and date from the transaction's `EscrowCreated`
 * event, so a trade can only be saved for an escrow the factory really created.
 */
export async function saveCreatedTrade(input: {
  transactionHash: Hash;
  escrow: Address;
  details: ItemDetails;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const details = itemDetailsSchema.safeParse(input.details);
  if (!details.success || !isHash(input.transactionHash) || !isAddress(input.escrow)) {
    return { ok: false, message: "The trade's details were invalid." };
  }

  let saved;
  try {
    saved = await saveTrade({ transactionHash: input.transactionHash, ...details.data });
  } catch (error) {
    if (!(error instanceof TradesApiError)) throw error;
    return { ok: false, message: "Couldn't reach the server. Try again in a moment." };
  }
  if (!saved.ok) return saved;
  // The browser redirects to `input.escrow`, so it must be the escrow saved.
  if (saved.escrow && !isAddressEqual(saved.escrow, input.escrow)) {
    return { ok: false, message: "That transaction didn't create this trade." };
  }

  revalidatePath("/trades");
  return { ok: true };
}
