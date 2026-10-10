import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Address } from "viem";
import { useConfig, useReadContracts } from "wagmi";
import { readContracts } from "wagmi/actions";

import { escrowStateReadCount, getEscrowStateContracts, withEscrowState } from "@/lib/escrow-sync";
import type { Trade } from "@/lib/trades";
import { fetchTrade, fetchTrades, type TradeListQuery } from "@/lib/trades-api";

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
    // Like the backend queries, returning to the tab doesn't reload state.
    query: { enabled: contracts.length > 0, refetchOnWindowFocus: false },
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
 * One page of the trades `account` created or added (see `fetchTrades`), with
 * their escrows' current state. The page and its escrow reads load in one
 * query, so while another page, tab, sort or search loads, the previous one
 * stays shown (`isPlaceholderData`) instead of a page with stored statuses.
 * `loadedAt` is when the page was fetched, which ages are measured from.
 */
export function useMyTrades(account: Address | undefined, query: TradeListQuery) {
  const config = useConfig();
  const page = useQuery({
    queryKey: [...tradesQueryKey, "list", account?.toLowerCase(), query],
    queryFn: async () => {
      const stored = await fetchTrades(account!, query);
      const contracts = stored.trades.flatMap(getEscrowStateContracts);
      // If the escrows can't be read, the stored values are kept.
      const reads =
        contracts.length > 0
          ? await readContracts(config, { contracts, batchSize: multicallBatchSize }).catch(() => undefined)
          : undefined;
      const trades = stored.trades.map((trade, index) =>
        withEscrowState(trade, reads?.slice(index * escrowStateReadCount, (index + 1) * escrowStateReadCount)),
      );
      return { ...stored, trades };
    },
    enabled: Boolean(account),
    retry: 1,
    // Keep showing the previous page while the next loads, but not another
    // wallet's trades.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === account?.toLowerCase() ? previous : undefined,
    // Returning to the tab doesn't reload the list, so its ages and statuses
    // stay as of when it was loaded.
    refetchOnWindowFocus: false,
  });

  return {
    page: page.data,
    isLoading: page.isPending,
    isPlaceholderData: page.isPlaceholderData,
    isError: page.isError,
    loadedAt: page.dataUpdatedAt,
  };
}

/**
 * The saved trade for an escrow with its current state, and whether `account`
 * archived it. `trade` is null once loaded if no trade was saved for it.
 */
export function useTrade(escrow: Address, account: Address | undefined) {
  const stored = useQuery({
    queryKey: [...tradesQueryKey, "one", escrow.toLowerCase(), account?.toLowerCase()],
    // React Query doesn't allow undefined data, so a missing trade is null.
    queryFn: async () => (await fetchTrade(escrow, account)) ?? null,
    retry: 1,
    // Like the list, returning to the tab doesn't reload the trade.
    refetchOnWindowFocus: false,
  });
  const storedTrades = useMemo(() => (stored.data ? [stored.data.trade] : undefined), [stored.data]);
  const live = useLiveTrades(storedTrades);

  return {
    trade: stored.data === null ? null : live.trades?.[0],
    isArchived: stored.data?.isArchived ?? false,
    isLoading: stored.isPending || live.isLoading,
    isError: stored.isError,
    refetch: stored.refetch,
    loadedAt: stored.dataUpdatedAt,
  };
}
