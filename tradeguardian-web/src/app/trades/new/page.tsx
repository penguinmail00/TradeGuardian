import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";

export const metadata: Metadata = {
  title: "Add a trade | TradeGuardian",
  description: "Create a new escrow-protected trade.",
};

/**
 * Placeholder until the create-trade form (EscrowFactory.createEscrow) is
 * built. Rendered entirely on the server.
 */
export default function AddTradePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-16 lg:pt-24 lg:pb-24">
            <p className="type-eyebrow text-accent">My Trades</p>
            <h1 className="type-h1 mt-3 text-balance">Add a trade</h1>
            <p className="type-body-lg mt-4 text-muted text-pretty">
              Creating trades is coming soon.
            </p>
            <Link href="/trades" className="btn btn-secondary mt-8 w-full sm:w-auto">
              Back to my trades
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
