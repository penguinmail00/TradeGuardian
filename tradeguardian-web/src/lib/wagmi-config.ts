import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monad as viemMonad, monadTestnet as viemMonadTestnet } from "wagmi/chains";
import { z } from "zod";

const walletConnectProjectId = z
  .string({
    error:
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Create one at https://cloud.reown.com and add it to .env.local.",
  })
  .min(1)
  .parse(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

// The testnet uses a gray Monad logo so it is easy to tell apart from mainnet.
const monadTestnet = {
  ...viemMonadTestnet,
  iconUrl: "/images/chains/monad-testnet.svg",
  iconBackground: "transparent",
};

const monad = {
  ...viemMonad,
  name: "Monad Mainnet",
  iconUrl: "/images/chains/monad.svg",
  iconBackground: "transparent",
};

export const wagmiConfig = getDefaultConfig({
  appName: "TradeGuardian",
  projectId: walletConnectProjectId,
  chains: [monadTestnet, monad],
  ssr: true,
});
