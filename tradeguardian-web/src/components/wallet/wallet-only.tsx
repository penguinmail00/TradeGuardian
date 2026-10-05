"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";

/**
 * Renders its children only while a wallet is connected. The server and the
 * first client render have no wallet, so they render nothing and the
 * children appear once wagmi reconnects.
 */
export function WalletOnly({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  return isConnected ? children : null;
}
