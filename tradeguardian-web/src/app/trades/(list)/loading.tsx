import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { Placeholder } from "@/components/trades/placeholder";

import { TradesIntro } from "./trades-intro";

const placeholderRowCount = 4;

/**
 * Shown while My trades loads its trades from the backend and the chain. The
 * title and actions are real, so they're usable straight away; the tabs,
 * search and list are placeholders in the same places as the loaded page.
 */
export default function MyTradesLoading() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <TradesIntro />
        <div
          role="status"
          aria-label="Loading your trades"
          className="mx-auto w-[calc(100%-60px)] max-w-[1140px] pb-16 motion-safe:animate-pulse lg:pb-24"
        >
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:border-b lg:border-border">
            <div className="flex gap-6 border-b border-border pb-3 lg:border-b-0">
              <Placeholder className="h-5 w-24" />
              <Placeholder className="h-5 w-24" />
            </div>
            <Placeholder className="h-11 w-full sm:max-w-md lg:mb-1.5 lg:h-9" />
          </div>
          <div className="panel">
            <div className="border-b border-border px-4 py-3 lg:px-6">
              <Placeholder className="h-4 w-1/3" />
            </div>
            <ul className="divide-y divide-border">
              {Array.from({ length: placeholderRowCount }, (_, index) => (
                <li key={index} className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
                  <Placeholder className="h-5 w-2/5 md:w-1/4" />
                  <Placeholder className="h-6 w-28 rounded-full" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
