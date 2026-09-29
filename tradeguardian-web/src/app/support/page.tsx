import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";

import { SupportForm } from "./support-form";

export const metadata: Metadata = {
  title: "Support | TradeGuardian",
  description:
    "Contact the TradeGuardian support team. Send us a request and we'll reply by email.",
};

/** Support request page. Only the form itself is a Client Component. */
export default function SupportPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-12 lg:pt-24 lg:pb-16">
            <p className="type-eyebrow text-accent">Support</p>
            <h1 className="type-h1 mt-3 text-balance">How can we help?</h1>
            <p className="type-body-lg mt-4 text-muted text-pretty">
              Tell us what&apos;s going on and we&apos;ll get back to you by
              email.
            </p>
          </div>
        </section>
        <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pb-16 lg:pb-24">
          <SupportForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
