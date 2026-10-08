import Link from "next/link";

/** The page title and actions, which don't depend on the trades, so they show straight away. */
export function TradesIntro() {
  return (
    <section className="pt-(--header-height)">
      <div className="mx-auto flex w-[calc(100%-60px)] max-w-[1140px] flex-col gap-6 pt-16 pb-12 sm:flex-row sm:items-center sm:justify-between lg:pt-24 lg:pb-16">
        <div>
          <h1 className="type-h1 text-balance">My trades</h1>
        </div>
        <TradeActions />
      </div>
    </section>
  );
}

/** Create a new trade, or add one the other side created. Stacked on phones, Create on top. */
function TradeActions() {
  return (
    <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
      <Link href="/trades/create" className="btn btn-primary w-full sm:w-auto">
        Create a trade
      </Link>
      <Link href="/trades/new" className="btn btn-secondary w-full sm:w-auto">
        Add a trade
      </Link>
    </div>
  );
}
