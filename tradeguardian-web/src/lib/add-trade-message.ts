import type { Address } from "viem";

/**
 * What a wallet signs to add a trade to its list. Must match
 * `add_trade_message` in tradeguardian-backend, which rebuilds it to check
 * the signature, so addresses are lowercase.
 */
export function addTradeMessage(escrow: Address, account: Address, issuedAt: string) {
  return [
    "Add this trade to My Trades on TradeGuardian.",
    "",
    `Trade: ${escrow.toLowerCase()}`,
    `Wallet: ${account.toLowerCase()}`,
    `Issued at: ${issuedAt}`,
  ].join("\n");
}
