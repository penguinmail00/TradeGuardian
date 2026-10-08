import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Address } from "viem";

import type { Trade } from "@/lib/trades";

// Archiving is per wallet and off-chain, so it's kept in this browser's
// localStorage under the connected account. It doesn't follow the wallet to
// other browsers or devices.

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Other tabs' changes arrive as `storage` events.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function storageKey(account: Address) {
  return `tradeguardian.archived.${account.toLowerCase()}`;
}

/** The stored JSON, so the snapshot only changes when the list does. */
function readStored(account: Address | undefined) {
  if (!account) return "";
  try {
    return window.localStorage.getItem(storageKey(account)) ?? "";
  } catch {
    // Storage can be blocked (e.g. some private windows).
    return "";
  }
}

function parseEscrows(stored: string): string[] {
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Which of `account`'s trades are archived, and a setter. Nothing is archived
 * while no wallet is connected, and `setArchived` does nothing then.
 */
export function useArchivedTrades(account: Address | undefined) {
  const stored = useSyncExternalStore(
    subscribe,
    () => readStored(account),
    () => "",
  );
  const archived = useMemo(() => new Set(parseEscrows(stored)), [stored]);

  const isArchived = useCallback((trade: Trade) => archived.has(trade.escrow.toLowerCase()), [archived]);

  const setArchived = useCallback(
    (trade: Trade, shouldArchive: boolean) => {
      if (!account) return;
      const next = new Set(parseEscrows(readStored(account)));
      if (shouldArchive) next.add(trade.escrow.toLowerCase());
      else next.delete(trade.escrow.toLowerCase());
      try {
        window.localStorage.setItem(storageKey(account), JSON.stringify([...next]));
      } catch {
        return;
      }
      listeners.forEach((onChange) => onChange());
    },
    [account],
  );

  return { isArchived, setArchived };
}
