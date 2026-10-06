"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { useAccount } from "wagmi";

const createTradeHref = "/trades/create";

/**
 * Link to the create-trade page. With no wallet connected it opens
 * RainbowKit's connect modal instead, like the header's Connect wallet
 * button, and continues to the page once a wallet connects. Closing the
 * modal without connecting leaves the user where they are.
 */
export function CreateTradeLink({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { isConnected, isDisconnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  // Set by a click that opened the modal; a ref, since it never changes
  // what renders.
  const isWaitingForWallet = useRef(false);

  useEffect(() => {
    if (!isWaitingForWallet.current) return;
    if (isConnected) {
      isWaitingForWallet.current = false;
      router.push(createTradeHref);
    } else if (!connectModalOpen) {
      isWaitingForWallet.current = false;
    }
  }, [isConnected, connectModalOpen, router]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // While wagmi is still reconnecting a saved wallet, follow the link.
    if (!isDisconnected || !openConnectModal) return;
    event.preventDefault();
    isWaitingForWallet.current = true;
    openConnectModal();
  }

  return (
    <Link href={createTradeHref} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
