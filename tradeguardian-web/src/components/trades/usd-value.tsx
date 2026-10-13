import { useUsdPrice } from "@/lib/use-usd-price";

const usdFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/**
 * What `amount` of `symbol` (e.g. MON) is worth in USD at Coinbase's spot
 * price, like `$12.09`, or `($12.09)` when `parenthesized`. Renders nothing
 * without an amount, while the price loads, or if it can't be fetched.
 */
export function UsdValue({
  amount,
  symbol,
  parenthesized = false,
  className,
}: {
  amount: number | undefined;
  symbol: string;
  parenthesized?: boolean;
  className?: string;
}) {
  const { data: usdPrice } = useUsdPrice(symbol, { enabled: amount !== undefined });
  if (amount === undefined || usdPrice === undefined) return null;

  const usd = amount * usdPrice;
  const text = usd > 0 && usd < 0.01 ? "<$0.01" : usdFormat.format(usd);
  return (
    <span className={`tabular-nums ${className ?? ""}`}>{parenthesized ? `(${text})` : text}</span>
  );
}
