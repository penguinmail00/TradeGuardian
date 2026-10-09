import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Address } from "viem";
import { useReadContracts } from "wagmi";

import { escrowStateReadCount, getEscrowStateContracts, withEscrowState } from "@/lib/escrow-sync";
import type { Trade } from "@/lib/trades";
import { fetchTrade, fetchTrades } from "@/lib/trades-api";

/**
 * Prefix of every backend query's key, so a saved trade or a transaction can
 * invalidate them all.
 */
export const tradesQueryKey = ["trades"] as const;

/**
 * Multicall calldata per request, in bytes. viem's default (1KB) would split
 * a long list's reads into many parallel requests, which the public RPC
 * rate-limits; this keeps a hundred trades in one or two.
 */
const multicallBatchSize = 64 * 1024;

/**
 * `trades` with each escrow's current state, read in one multicall for all of
 * them. Until the reads finish, or if they fail, the stored values are kept;
 * `isLoading` is true while they're in flight.
 */
function useLiveTrades(trades: Trade[] | undefined) {
  const contracts = useMemo(() => trades?.flatMap(getEscrowStateContracts) ?? [], [trades]);
  const reads = useReadContracts({
    contracts,
    batchSize: multicallBatchSize,
    query: { enabled: contracts.length > 0 },
  });

  const liveTrades = useMemo(
    () =>
      trades?.map((trade, index) =>
        withEscrowState(
          trade,
          reads.data?.slice(index * escrowStateReadCount, (index + 1) * escrowStateReadCount),
        ),
      ),
    [trades, reads.data],
  );
  return { trades: liveTrades, isLoading: contracts.length > 0 && reads.isPending };
}

/**
 * The trades `account` created or added, newest first, with
 * their escrows' current state. `loadedAt` is when the list was fetched, which
 * ages are measured from.
 */
export function useMyTrades(account: Address | undefined) {
  const stored = useQuery({
    queryKey: [...tradesQueryKey, "list", account?.toLowerCase()],
    queryFn: () => fetchTrades(account!),
    enabled: Boolean(account),
    retry: 1,
  });
  const live = useLiveTrades(stored.data);

  return {
    trades: live.trades,
    isLoading: stored.isPending || live.isLoading,
    isError: stored.isError,
    loadedAt: stored.dataUpdatedAt,
  };
}

/**
 * The saved trade for an escrow with its current state. `trade` is null once
 * loaded if no trade was saved for it.
 */
export function useTrade(escrow: Address) {
  const stored = useQuery({
    queryKey: [...tradesQueryKey, "one", escrow.toLowerCase()],
    // React Query doesn't allow undefined data, so a missing trade is null.
    queryFn: async () => (await fetchTrade(escrow)) ?? null,
    retry: 1,
  });
  const storedTrades = useMemo(() => (stored.data ? [stored.data] : undefined), [stored.data]);
  const live = useLiveTrades(storedTrades);

  return {
    trade: stored.data === null ? null : live.trades?.[0],
    isLoading: stored.isPending || live.isLoading,
    isError: stored.isError,
    refetch: stored.refetch,
    loadedAt: stored.dataUpdatedAt,
  };
}
