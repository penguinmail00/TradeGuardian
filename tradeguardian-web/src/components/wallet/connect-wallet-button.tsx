"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * RainbowKit connect button sized for the site header: an avatar-only account
 * chip and no balance on small screens.
 */
export function ConnectWalletButton() {
  return (
    <ConnectButton
      label="Connect wallet"
      chainStatus="icon"
      accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
      showBalance={{ smallScreen: false, largeScreen: true }}
    />
  );
}
