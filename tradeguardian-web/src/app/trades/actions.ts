"use server";

import { revalidatePath } from "next/cache";

import { findTrade, setArchived } from "@/lib/fake-trades";
import { canArchive } from "@/lib/trades";

/**
 * Archives or unarchives a finished trade. Expects `escrow` and `archived`
 * ("true" or "false") form fields; both come from the client, so they are
 * checked again here.
 */
export async function setTradeArchived(formData: FormData) {
  const escrow = formData.get("escrow");
  const archived = formData.get("archived");
  if (typeof escrow !== "string" || (archived !== "true" && archived !== "false")) return;

  const trade = findTrade(escrow);
  if (!trade || !canArchive(trade)) return;

  setArchived(trade, archived === "true");
  revalidatePath("/trades");
  revalidatePath(`/trades/${trade.escrow}`);
}
