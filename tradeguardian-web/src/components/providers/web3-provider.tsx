"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { AccountChangeHandler } from "@/components/wallet/account-change-handler";
import { wagmiConfig } from "@/lib/wagmi-config";

// Matches the --accent / --on-accent design tokens in globals.css.
const rainbowTheme = darkTheme({
  accentColor: "#00c3ff",
  accentColorForeground: "#0c0c0f",
  borderRadius: "medium",
});

/**
 * Supplies wagmi, React Query and RainbowKit context to client components.
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  // One QueryClient per browser session, not shared across server requests.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <AccountChangeHandler />
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
