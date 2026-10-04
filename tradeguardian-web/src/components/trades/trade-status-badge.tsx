import { tradeStatuses, type EscrowState } from "@/lib/trades";

export function TradeStatusBadge({ state }: { state: EscrowState }) {
  const status = tradeStatuses[state];

  return (
    <span
      className={`type-small inline-block whitespace-nowrap rounded-full px-3 py-1 font-medium ${status.className}`}
    >
      {status.label}
    </span>
  );
}
