import { getAddress, isAddress, type Address } from "viem";
import { deserialize, type State } from "wagmi";

/** Where wagmi's `cookieStorage` keeps its state, under the default `wagmi` key. */
export const wagmiCookieName = "wagmi.store";

/**
 * The connected account in wagmi's stored state (the `wagmi.store` cookie's
 * value). Undefined when no wallet is connected or the value can't be read.
 */
export function getAccountFromWagmiCookie(stored: string | undefined): Address | undefined {
  if (!stored) return undefined;

  try {
    const { state } = deserialize<{ state: Partial<State> }>(stored);
    const account =
      state.current ? state.connections?.get(state.current)?.accounts[0] : undefined;
    return account && isAddress(account) ? getAddress(account) : undefined;
  } catch {
    return undefined;
  }
}
