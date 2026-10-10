import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { BaseError, UserRejectedRequestError, type Address } from "viem";
import { useSignMessage } from "wagmi";

import { archiveTradeMessage } from "@/lib/archive-trade-message";
import { BackendApiError } from "@/lib/backend-api";
import type { Trade } from "@/lib/trades";
import { setTradeArchived } from "@/lib/trades-api";
import { tradesQueryKey } from "@/lib/use-trades";

// Archiving is per wallet and stored by the backend, so it follows the wallet
// to other browsers and devices.

/**
 * Archives or unarchives a trade in `account`'s list. The wallet signs each
 * change, since the backend only changes a list its wallet signed for.
 * `error` is the last failure's message, cleared on the next try.
 */
export function useArchiveTrade(account: Address | undefined) {
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  const setArchived = useCallback(
    async (trade: Trade, shouldArchive: boolean) => {
      if (!account) return;
      setIsPending(true);
      setError(undefined);
      try {
        setError(await archive(trade.escrow, account, shouldArchive));
        // So the trade page and My Trades show the change.
        await queryClient.invalidateQueries({ queryKey: tradesQueryKey });
      } finally {
        setIsPending(false);
      }

      async function archive(escrow: Address, account: Address, archived: boolean) {
        // Signing happens in the wallet and isn't a transaction, so it costs
        // no gas.
        const issuedAt = new Date().toISOString();
        let signature;
        try {
          signature = await signMessageAsync({ message: archiveTradeMessage(escrow, account, archived, issuedAt) });
        } catch (error) {
          if (error instanceof BaseError && error.walk((e) => e instanceof UserRejectedRequestError)) {
            return "Request rejected in your wallet.";
          }
          return error instanceof BaseError ? error.shortMessage : "Couldn't sign the request. Try again.";
        }

        let result;
        try {
          result = await setTradeArchived({ escrow, account, archived, issuedAt, signature });
        } catch (error) {
          if (!(error instanceof BackendApiError)) throw error;
          return "Couldn't reach the server. Try again in a moment.";
        }
        return result.ok ? undefined : result.message;
      }
    },
    [account, signMessageAsync, queryClient],
  );

  return { setArchived, isPending, error };
}
