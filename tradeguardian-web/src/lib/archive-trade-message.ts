import type { Address } from "viem";

/**
 * What a wallet signs to archive or unarchive a trade in its list. Must match
 * `archive_trade_message` in tradeguardian-backend, which rebuilds it to check
 * the signature, so addresses are lowercase.
 */
export function archiveTradeMessage(escrow: Address, account: Address, archived: boolean, issuedAt: string) {
  return [
    `${archived ? "Archive" : "Unarchive"} this trade in My Trades on TradeGuardian.`,
    "",
    `Trade: ${escrow.toLowerCase()}`,
    `Wallet: ${account.toLowerCase()}`,
    `Issued at: ${issuedAt}`,
  ].join("\n");
}
