import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";

import { MyTradesList, TradeListPlaceholder } from "./my-trades";
import { TradesIntro } from "./trades-intro";

export const metadata: Metadata = {
  title: "My Trades | TradeGuardian",
  description: "Track the status of every trade you are buying or selling.",
};

/**
 * The connected wallet's trades. Only the static frame is built ahead of time;
 * the list loads and renders in the browser (`MyTradesList`). The title and
 * actions sit outside its Suspense boundary, so they render once and aren't
 * replaced when the list takes over from the placeholder.
 */
export default function MyTradesPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <TradesIntro />
        <div className="mx-auto w-[calc(100%-60px)] max-w-[1140px] pb-16 lg:pb-24">
          {/* useSearchParams needs a Suspense boundary on a prerendered page. */}
          <Suspense fallback={<TradeListPlaceholder />}>
            <MyTradesList />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
