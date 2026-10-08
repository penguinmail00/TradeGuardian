"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { isAddressEqual, type Address } from "viem";
import { parseCookie, useAccount } from "wagmi";

import { getAccountFromWagmiCookie, wagmiCookieName } from "@/lib/wagmi-cookie";

/**
 * Disconnecting the wallet goes to the home page. Pages read the wallet with
 * `useAccount`, so connecting or switching accounts updates them in place;
 * only a disconnect needs handling here. Renders nothing.
 */
export function AccountChangeHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, status } = useAccount();
  // The account the page was last rendered for, or null before mount.
  const renderedAccount = useRef<Address | undefined | null>(null);

  useEffect(() => {
    // On mount, wagmi hasn't restored its state yet (with `ssr`, it starts
    // disconnected), so only note the wallet stored in its cookie, as it was
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
  }, [address, status, router, pathname]);

  return null;
}
