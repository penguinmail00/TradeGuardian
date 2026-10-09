import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { BackToTradesLink } from "@/components/trades/back-to-trades-link";

import { AddTradeForm } from "./add-trade-form";

export const metadata: Metadata = {
  title: "Add a trade | TradeGuardian",
  description: "Add an escrow-protected trade you are buying or selling.",
};

/**
 * Adds an existing escrow to the connected wallet's list by its contract
 * address. The form checks on-chain that the wallet is the escrow's buyer or
 * seller, and the wallet signs the request.
 */
export default function AddTradePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-16 lg:pt-24 lg:pb-24">
            <BackToTradesLink />
            <h1 className="type-h1 mt-8 text-balance">Add a trade</h1>
            <div className="mt-10">
              <AddTradeForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
