import { Placeholder } from "@/components/trades/placeholder";

/** Rough widths of the four step names, so the placeholders vary like the text. */
const stepLabelWidths = ["w-28", "w-36", "w-64", "w-60"];

/** One per row under the Create Trade step, like `CreationDetails`. */
const detailRowCount = 9;

/**
 * Shown under the layout's back link, heading and explorer link while a trade
 * page loads its trade from the backend and the chain. Placeholders only, no
 * text, in the same place and size as the loaded trade: the step markers and
 * names, and the trade's details.
 */
export default function TradeLoading() {
  return (
    <div
      role="status"
      aria-label="Loading trade"
      className="panel mt-10 px-5 py-6 motion-safe:animate-pulse lg:px-6"
    >
      <ol className="flex flex-col">
        {stepLabelWidths.map((width, index) => (
          // Same spacing as TradeProgressStepper: 40px markers, a 16px
          // gap to the label, and a line down to the next step.
          <li
            key={index}
            className="relative pb-8 last:pb-0 not-last:before:absolute not-last:before:top-[52px] not-last:before:bottom-3 not-last:before:left-5 not-last:before:w-px not-last:before:bg-border"
          >
            <div className="flex items-center gap-4">
              <Placeholder className="size-10 shrink-0 rounded-full" />
              <Placeholder className={`h-5 max-w-full ${width}`} />
            </div>
            {index === 0 && <DetailsPlaceholder />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DetailsPlaceholder() {
  return (
    <dl className="type-small mt-2 grid grid-cols-[minmax(0,1fr)] gap-2 pl-14 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
      {Array.from({ length: detailRowCount }, (_, index) => (
        <div key={index} className="sm:contents">
          <dt>
            <Placeholder className="h-5 w-28" />
          </dt>
          <dd>
            <Placeholder className="h-5 w-40 max-w-full" />
          </dd>
        </div>
      ))}
    </dl>
  );
}
