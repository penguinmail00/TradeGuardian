"use server";

import { revalidatePath } from "next/cache";
import { isAddress } from "viem";

import { setArchived } from "@/lib/archived-trades";
import { syncTradeFromChain } from "@/lib/escrow-sync";
import { canArchive } from "@/lib/trades";
import { fetchTrade } from "@/lib/trades-api";

/**
 * Archives or unarchives a finished trade. Expects `escrow` and `archived`
 * ("true" or "false") form fields; both come from the client, so they are
 * checked again here.
 */
export async function setTradeArchived(formData: FormData) {
  const escrow = formData.get("escrow");
  const archived = formData.get("archived");
  if (typeof escrow !== "string" || !isAddress(escrow) || (archived !== "true" && archived !== "false")) return;

  const stored = await fetchTrade(escrow);
  // Whether it can be archived depends on the escrow's current state.
  const trade = stored && (await syncTradeFromChain(stored));
  if (!trade || !canArchive(trade)) return;

  setArchived(trade, archived === "true");
  revalidatePath("/trades");
  revalidatePath(`/trades/${trade.escrow}`);
}
