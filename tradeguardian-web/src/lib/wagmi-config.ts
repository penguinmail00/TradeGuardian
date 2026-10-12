import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cookieStorage, createStorage } from "wagmi";
import { monad as viemMonad } from "wagmi/chains";
import { z } from "zod";

const walletConnectProjectId = z
  .string({
    error:
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Create one at https://cloud.reown.com and add it to .env.local.",
  })
  .min(1)
  .parse(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

const monad = {
  ...viemMonad,
  name: "Monad Mainnet",
  iconUrl: "/images/chains/monad.svg",
  iconBackground: "transparent",
};

export const wagmiConfig = getDefaultConfig({
  appName: "TradeGuardian",
  projectId: walletConnectProjectId,
  chains: [monad],
  ssr: true,
  // In a cookie, so `AccountChangeHandler` can read the stored wallet before
  // wagmi reconnects it.
  storage: createStorage({ storage: cookieStorage }),
});
