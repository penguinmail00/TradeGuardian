import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";

type Faq = {
  question: string;
  /** One entry per paragraph. */
  answer: string[];
};

const faqs: Faq[] = [
  {
    question: "Why does the seller need a deposit if they hand over the item first?",
    answer: [
      "A deposit of 1x the item price shows the seller is serious. Without one, anyone could open trades they never intend to finish and waste buyers' time at no cost. Once the seller has money in the contract, abandoning the trade means their deposit stays locked, so there is no reason to start a trade they don't plan to complete.",
    ],
  },
  {
    question: "Why does the buyer deposit twice the item price?",
    answer: [
      "Because the seller always hands over the item first. If the buyer deposited only 1x the price, that deposit would effectively pay for the item: they could keep it without ever confirming the trade, and the seller would never be paid.",
      "At 2x, walking away means paying double. If the item costs $100, a buyer who keeps it without confirming leaves $200 locked in the contract, $100 more than an honest purchase from any other seller. Scamming never pays.",
    ],
  },
  {
    question: "What if the other person never makes their deposit?",
    answer: [
      "You're never stuck waiting. If the other person hasn't made their deposit within 2 hours, you can cancel the trade and get your deposit back.",
    ],
  },
  {
    question: "What if the seller hands over the wrong item?",
    answer: [
      "The buyer won't confirm the trade, so the contract stays locked with both deposits inside. The seller would lose their deposit and gain nothing, so a rational seller has no reason to try it.",
    ],
  },
];

export const metadata: Metadata = {
  title: "FAQ | TradeGuardian",
  description:
    "Answers to common questions about how TradeGuardian deposits work and why they keep both sides of a trade honest.",
};

/**
 * FAQPage structured data built from the same content that is rendered, so
 * search results never drift from the page.
 */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer.join("\n\n") },
  })),
};

/**
 * Frequently asked questions, all shown expanded. Rendered entirely on the
 * server.
 */
export default function FaqPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <script
        type="application/ld+json"
        // Escaping `<` prevents the payload from closing the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main className="flex-1">
        <FaqIntro />
        <div className="mx-auto flex w-[calc(100%-60px)] max-w-[800px] flex-col gap-12 pb-16 lg:gap-16 lg:pb-24">
          <ul aria-label="Questions" className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <li key={faq.question}>
                <FaqItem faq={faq} />
              </li>
            ))}
          </ul>
          <SupportCallout />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FaqIntro() {
  return (
    <section className="pt-(--header-height)">
      <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-12 lg:pt-24 lg:pb-16">
        <p className="type-eyebrow text-accent">FAQ</p>
        <h1 className="type-h1 mt-3 text-balance">
          Frequently asked questions
        </h1>
        <p className="type-body-lg mt-4 text-muted text-pretty">
          Everything you need to know about trading safely with TradeGuardian.
        </p>
      </div>
    </section>
  );
}

function FaqItem({ faq }: { faq: Faq }) {
  return (
    <article className="panel p-5 lg:p-6">
      <h2 className="type-h3 text-pretty">{faq.question}</h2>
      <div className="type-body mt-3 flex flex-col gap-3 text-muted text-pretty">
        {faq.answer.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

function SupportCallout() {
  return (
    <aside className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
      <div>
        <h2 className="type-h3">Still have questions?</h2>
        <p className="type-body mt-2 text-muted">
          Our support team is happy to help with anything not covered here.
        </p>
      </div>
      <Link href="/support" className="btn btn-primary w-full sm:w-auto">
        Contact support
      </Link>
    </aside>
  );
}
