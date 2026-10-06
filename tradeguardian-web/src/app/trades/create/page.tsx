import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { BackToTradesLink } from "@/components/trades/back-to-trades-link";

import { CreateTradeForm } from "./create-trade-form";

export const metadata: Metadata = {
  title: "Create a trade | TradeGuardian",
  description: "Start an escrow-protected trade with a buyer or seller.",
};

/**
 * Creates a new escrow for an item the connected wallet is buying or selling.
 * Once created, the other side adds it with its contract address.
 */
export default function CreateTradePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-16 lg:pt-24 lg:pb-24">
            <BackToTradesLink />
            <h1 className="type-h1 mt-8 text-balance">Create a trade</h1>
            <div className="mt-10">
              <CreateTradeForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
