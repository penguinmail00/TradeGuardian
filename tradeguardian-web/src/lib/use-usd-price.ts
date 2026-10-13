import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

/** How long a fetched price is used before it's fetched again. */
const priceMaxAge = 60_000;

const spotPriceSchema = z.object({
  data: z.object({ amount: z.string() }),
});

/** Coinbase's spot price of one `symbol` in USD, from its public, keyless API. */
async function fetchUsdPrice(symbol: string, signal: AbortSignal) {
  const response = await fetch(
    `https://api.coinbase.com/v2/prices/${encodeURIComponent(symbol)}-USD/spot`,
    { signal },
  );
  if (!response.ok) throw new Error(`Coinbase price request failed (${response.status}).`);
  const price = Number(spotPriceSchema.parse(await response.json()).data.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Coinbase returned an invalid price.");
  return price;
}

/**
 * The USD price of one `symbol` (e.g. MON), refreshed every minute while
 * `enabled`. `data` stays undefined while loading or if Coinbase doesn't
 * list the token or can't be reached.
 */
export function useUsdPrice(symbol: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["usd-price", symbol],
    queryFn: ({ signal }) => fetchUsdPrice(symbol, signal),
    enabled,
    staleTime: priceMaxAge,
    refetchInterval: priceMaxAge,
    retry: 1,
  });
}
