"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import {
  getPendingTradeSaves,
  pendingTradeSaveLifetimeMs,
  removePendingTradeSave,
} from "@/lib/pending-trade-saves";
import { saveTrade } from "@/lib/trades-api";
import { tradesQueryKey } from "@/lib/use-trades";

/**
 * Finishes saving trades whose page closed between sending the transaction
 * and saving the details, whenever a wallet connects. A save that fails, for
 * example because the transaction hasn't confirmed or the backend can't be
 * reached, is retried on the next visit until it's a week old. Saving is
 * idempotent, so racing the create form in another tab is harmless.
 * Renders nothing.
 */
export function PendingTradeSaveResumer() {
  const { address: account } = useAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!account) return;
    let isCancelled = false;

    async function resume(account: Address) {
      let hasSaved = false;
      for (const pending of getPendingTradeSaves(account)) {
        if (isCancelled) return;
        if (Date.now() - pending.sentAt > pendingTradeSaveLifetimeMs) {
          removePendingTradeSave(account, pending.transactionHash);
          continue;
        }
        try {
          const saved = await saveTrade({
            transactionHash: pending.transactionHash,
            itemName: pending.itemName,
            description: pending.description,
          });
          if (!saved.ok) continue;
        } catch {
          continue;
        }
        removePendingTradeSave(account, pending.transactionHash);
        hasSaved = true;
      }
      // So My trades and the trade page show what was just saved.
      if (hasSaved) await queryClient.invalidateQueries({ queryKey: tradesQueryKey });
    }

    void resume(account);
    return () => {
      isCancelled = true;
    };
  }, [account, queryClient]);

  return null;
}
