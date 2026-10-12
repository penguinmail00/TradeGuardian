import { SiteFooter } from "@/components/site-shell/site-footer";
import { SiteHeader } from "@/components/site-shell/site-header";

export type LegalSection = {
  heading: string;
  /** One entry per paragraph. */
  paragraphs: string[];
};

/**
 * Layout for the terms and privacy pages: a heading block like the FAQ's,
 * then numbered sections of plain paragraphs. Static content, prerendered at
 * build time.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  /** Shown as written, e.g. "October 11, 2026". */
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-(--header-height)">
          <div className="mx-auto w-[calc(100%-60px)] max-w-[800px] pt-16 pb-12 lg:pt-24 lg:pb-16">
            <p className="type-eyebrow text-accent">Legal</p>
            <h1 className="type-h1 mt-3 text-balance">{title}</h1>
            <p className="type-small mt-3 text-muted">
              Last updated {lastUpdated}
            </p>
            <p className="type-body-lg mt-6 text-muted text-pretty">{intro}</p>
          </div>
        </section>
        <div className="mx-auto flex w-[calc(100%-60px)] max-w-[800px] flex-col gap-10 pb-16 lg:pb-24">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <h2 className="type-h3 text-pretty">
                {index + 1}. {section.heading}
              </h2>
              <div className="type-body mt-3 flex flex-col gap-3 text-muted text-pretty">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
