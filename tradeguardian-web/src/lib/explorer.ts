import type { Address } from "viem";

// Trades don't record their chain yet, and escrows are only deployed on
// Monad Testnet so far, so every link goes to the testnet explorer.
const explorerUrl = "https://testnet.monadvision.com";

export const explorerName = "MonadVision";

/** Explorer page for an address, such as a trade's escrow contract. */
export function getExplorerAddressUrl(address: Address) {
  return `${explorerUrl}/address/${address}`;
}
