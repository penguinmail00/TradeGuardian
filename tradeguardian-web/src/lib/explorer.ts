import type { Address } from "viem";

// Trades don't record their chain, and the site only uses Monad Mainnet, so
// every link goes to the mainnet explorer.
const explorerUrl = "https://monadscan.com";

export const explorerName = "MonadScan";

/** Explorer page for an address, such as a trade's escrow contract. */
export function getExplorerAddressUrl(address: Address) {
  return `${explorerUrl}/address/${address}`;
}
