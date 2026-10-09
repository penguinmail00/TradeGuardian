import type { Address, Hash } from "viem";
import { z } from "zod";

// A trade's escrow can exist on chain before its details reach the backend:
// the browser sends the transaction, waits for it to confirm, then saves. If
// the page closes in between, the item name and description would be lost, so
// they're kept in this browser's localStorage under the creator's account
// from the moment the transaction is sent until the save succeeds.

/** How long an unsaved trade is retried before it's given up on. */
export const pendingTradeSaveLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const pendingTradeSaveSchema = z.object({
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform((hash) => hash as Hash),
  itemName: z.string(),
  description: z.string(),
  /** When the transaction was sent, in ms since the epoch. */
  sentAt: z.number(),
});

export type PendingTradeSave = z.infer<typeof pendingTradeSaveSchema>;

function storageKey(account: Address) {
  return `tradeguardian.pendingTradeSaves.${account.toLowerCase()}`;
}

/** `account`'s unsaved trades, oldest first. Malformed entries are skipped. */
export function getPendingTradeSaves(account: Address): PendingTradeSave[] {
  let stored;
  try {
    stored = window.localStorage.getItem(storageKey(account));
  } catch {
    // Storage can be blocked (e.g. some private windows).
    return [];
  }
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const result = pendingTradeSaveSchema.safeParse(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

function writePendingTradeSaves(account: Address, saves: PendingTradeSave[]) {
  try {
    if (saves.length === 0) window.localStorage.removeItem(storageKey(account));
    else window.localStorage.setItem(storageKey(account), JSON.stringify(saves));
  } catch {
    // Without storage the trade just can't be recovered after a close.
  }
}

/** Remembers a trade whose transaction was just sent, until it's saved. */
export function addPendingTradeSave(account: Address, save: PendingTradeSave) {
  const others = getPendingTradeSaves(account).filter(
    (pending) => pending.transactionHash.toLowerCase() !== save.transactionHash.toLowerCase(),
  );
  writePendingTradeSaves(account, [...others, save]);
}

/** Forgets the trade `transactionHash` created, once it's saved or abandoned. */
export function removePendingTradeSave(account: Address, transactionHash: Hash) {
  writePendingTradeSaves(
    account,
    getPendingTradeSaves(account).filter(
      (pending) => pending.transactionHash.toLowerCase() !== transactionHash.toLowerCase(),
    ),
  );
}
