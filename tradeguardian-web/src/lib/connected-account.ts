import { cookies } from "next/headers";
import type { Address } from "viem";

import { getAccountFromWagmiCookie, wagmiCookieName } from "@/lib/wagmi-cookie";

/**
 * The wallet account connected in the browser, read on the server from the
 * cookie wagmi stores its connection state in. Undefined when no wallet is
 * connected.
 *
 * The cookie is set by the browser, so this only decides what to show (the
 * user's role and which actions to offer); the wallet still signs every
 * transaction, and the escrow checks who sent it.
 */
export async function getConnectedAccount(): Promise<Address | undefined> {
  return getAccountFromWagmiCookie((await cookies()).get(wagmiCookieName)?.value);
}
