"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { isAddressEqual, type Address } from "viem";
import { parseCookie, useAccount } from "wagmi";

import { getAccountFromWagmiCookie, wagmiCookieName } from "@/lib/wagmi-cookie";

/**
 * Server components read the connected wallet from wagmi's cookie (see
 * `getConnectedAccount`), so whenever the wallet wagmi settles on differs from
 * the one the page was last rendered for (connecting, switching accounts, or
 * a wallet that changed while the site was closed), this re-renders them.
 * Disconnecting goes to the home page instead. Renders nothing.
 */
export function AccountChangeHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, status } = useAccount();
  // The account the page was last rendered for, or null before mount.
  const renderedAccount = useRef<Address | undefined | null>(null);

  useEffect(() => {
    // On mount, wagmi hasn't restored its state yet (with `ssr`, it starts
    // disconnected), so only note the server's view: the cookie as it was
    // before wagmi reconnects and rewrites it. This component's effects run
    // before its provider's.
    if (renderedAccount.current === null) {
      renderedAccount.current = getAccountFromWagmiCookie(
        parseCookie(document.cookie, wagmiCookieName) ?? undefined,
      );
      return;
    }
    if (status === "connecting" || status === "reconnecting") return;

    const previous = renderedAccount.current;
    const hasChanged = previous && address ? !isAddressEqual(previous, address) : previous !== address;
    renderedAccount.current = address;
    if (!hasChanged) return;

    if (!address && pathname !== "/") router.push("/");
    else router.refresh();
  }, [address, status, router, pathname]);

  return null;
}
