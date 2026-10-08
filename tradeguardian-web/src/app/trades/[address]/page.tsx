import type { Metadata } from "next";

import { TradeView } from "./trade-view";

export const metadata: Metadata = {
  title: "Trade | TradeGuardian",
};

/**
 * A single trade, looked up by its escrow contract address. The trade loads
 * and renders in the browser (`TradeView`); the layout supplies the back link,
 * heading and explorer link from the URL.
 */
export default function TradePage() {
  return <TradeView />;
}
