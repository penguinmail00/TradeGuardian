import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { TradeDiagram } from "@/components/hero/trade-diagram";
import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";
import { CreateTradeLink } from "@/components/trades/create-trade-link";
import {
  TradeStepper,
  type TradeStep,
} from "@/components/trade-step-graph/trade-stepper";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: "Built on Monad",
    description: "Fast settlement and low gas fees for every trade.",
    // Monad's mark in its own purple; brand marks shouldn't be recolored.
    icon: (
      <Image
        src="/images/chains/monad.svg"
        alt=""
        width={33}
        height={32}
        className="size-6"
      />
    ),
  },
  {
    title: "Instant payout",
    description: "No more middlemen. Save your time and money.",
    icon: <LightningIcon />,
  },
  {
    title: "Powered by game theory",
    description: "Removes the incentive to scam, for buyers and sellers alike.",
    icon: <ChessKnightIcon />,
  },
];

const tradeSteps: TradeStep[] = [
  {
    title: "Create a trade",
    description:
      "Buyer and seller agree on the item and price, then either side can create the trade.",
  },
  {
    title: "Lock funds",
    description:
      "Both sides lock funds in escrow, so a successful trade is in everyone's best interest.",
  },
  {
    title: "Deliver the item",
    description:
      "The seller hands over the item and marks it as delivered.",
  },
  {
    title: "Release funds",
    description:
      "Once the buyer marks the agreed item as received, the funds are released automatically.",
  },
];

/**
 * TradeGuardian landing page. Static content with no data, so it's
 * prerendered at build time.
 */
export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TradeStepGraph steps={tradeSteps} />
        <FeatureGrid items={features} />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-x-clip pt-(--header-height)">
      <HeroBackdrop />
      {/* Matches blockstream.com's hero: left-aligned in a centered 1140px
          column (30px gutters below that), heading 214px below the header. */}
      <div className="relative mx-auto w-[calc(100%-60px)] max-w-[1140px] py-24 min-[1090px]:pt-[214px] min-[1090px]:pb-32">
        {/* Centered on the copy (the column's padding is 214px top, 128px
            bottom). Desktop only: below 1090px the copy takes the full width. */}
        <TradeDiagram className="absolute top-[calc(50%+43px)] right-0 hidden w-[440px] -translate-y-1/2 min-[1090px]:block" />
        <h1 className="type-hero max-w-[627px] text-balance">
          Trade with confidence.
        </h1>
        <p className="type-body-lg mt-6 max-w-[535px] text-muted text-pretty">
          TradeGuardian protects every trade from start to finish, so you can
          buy and sell without worrying about getting burned.
        </p>
        <div
          id="get-started"
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <CreateTradeLink className="btn btn-lg btn-primary w-full sm:w-auto">
            Create a trade
          </CreateTradeLink>
          <Link
            href="#features"
            className="btn btn-lg btn-secondary w-full sm:w-auto"
          >
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Decorative dot grid with two cyan glows (785px, top-left and bottom-right).
 * The lower glow intentionally extends past the hero into the next section.
 */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="bg-dot-grid fade-out-bottom absolute inset-0 -z-10" />
      <div className="bg-glow-cyan absolute top-[-25%] left-[-150px] -z-20 size-[785px]" />
      <div className="bg-glow-cyan absolute right-[-200px] bottom-[-320px] -z-20 size-[785px]" />
    </div>
  );
}

/**
 * Trade lifecycle section. The heading stays server-rendered; only the MUI
 * stepper itself is a client component.
 */
function TradeStepGraph({ steps }: { steps: TradeStep[] }) {
  return (
    <section aria-labelledby="trade-steps-heading" className="relative">
      <div className="mx-auto w-[calc(100%-60px)] max-w-[1140px]">
        <p className="type-eyebrow text-accent">How it works</p>
        <h2 id="trade-steps-heading" className="type-h2 mt-3 text-balance">
          Every trade, protected in {steps.length} steps
        </h2>
        <TradeStepper steps={steps} />
      </div>
    </section>
  );
}

function FeatureGrid({ items }: { items: Feature[] }) {
  return (
    <section id="features" className="relative scroll-mt-4">
      <div className="mx-auto grid w-[calc(100%-60px)] max-w-[1140px] gap-6 py-16 md:grid-cols-3 lg:py-24">
        {items.map((feature) => (
          <article key={feature.title} className="panel p-6 lg:p-8">
            <div className="grid size-12 place-items-center rounded-md bg-tint-cyan text-accent">
              {feature.icon}
            </div>
            <h2 className="type-h3 mt-5">{feature.title}</h2>
            <p className="type-body mt-3 text-muted">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LightningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <path d="M13 2.5 4.5 13.5H11L10 21.5l8.5-11H12l1-8Z" />
    </svg>
  );
}

function ChessKnightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <path d="M8 18c0-3 1.5-5 4-6.5L9.5 11 7 12.5 5.5 10.5l3.5-5 1-2.5 1.5 2c4 .5 6.5 4 6.5 8.5V18H8Z" />
      <path d="M6 21h13" />
      <circle cx="10.5" cy="8" r="0.5" fill="currentColor" />
    </svg>
  );
}
