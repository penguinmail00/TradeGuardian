"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * RainbowKit connect button sized for the site header: an avatar-only account
 * chip and no balance on small screens. The wrapper only hooks up the
 * no-hover-grow styles in globals.css; `contents` keeps it out of the layout.
 */
export function ConnectWalletButton() {
  return (
    <div className="connect-wallet-button contents">
      <ConnectButton
        label="Connect wallet"
        chainStatus="icon"
        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
        showBalance={{ smallScreen: false, largeScreen: true }}
      />
    </div>
  );
}
