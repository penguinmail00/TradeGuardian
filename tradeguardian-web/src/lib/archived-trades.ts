import type { Address } from "viem";

import type { Trade } from "@/lib/trades";

// Archiving is per user and off-chain. The backend doesn't store it yet, so
// this lives in server memory and resets whenever the server restarts.
const archivedEscrows = new Set<Address>();

export function isArchived(trade: Trade) {
  return archivedEscrows.has(trade.escrow);
}

export function setArchived(trade: Trade, archived: boolean) {
  if (archived) archivedEscrows.add(trade.escrow);
  else archivedEscrows.delete(trade.escrow);
}
