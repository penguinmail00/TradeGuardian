"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { CopyButton } from "@/components/trades/copy-button";
import { formatAge, formatTimestamp, type TimestampFormat } from "@/lib/time";

/*
 * Times are shown the way Etherscan does: an age ("2 days 3 hrs ago") that
 * ticks while the page is open, and a timestamp in UTC, the viewer's local
 * time, or Unix seconds.
 *
 * The server knows neither the viewer's clock nor their time zone, so it
 * renders from `serverNow` and shows local times as UTC. During hydration the
 * clock store reports its server value, so the first client render matches
 * the server; React then re-renders with the live clock and local time.
 */

// --- Shared clock: one interval for every time on the page. ---------------

let now: number | null = null;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    clockTimer = setInterval(() => {
      now = Date.now();
      clockListeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) clearInterval(clockTimer);
  };
}

function getClockSnapshot() {
  now ??= Date.now();
  return now;
}

/** Live time on the client; `null` on the server and during hydration. */
function useClientNow() {
  return useSyncExternalStore(subscribeToClock, getClockSnapshot, () => null);
}

const timestampFormatLabels: Record<TimestampFormat, string> = {
  utc: "UTC",
  local: "Local",
  unix: "Unix Timestamp",
};

// --- Components. -----------------------------------------------------------

type TimeProps = {
  /** ISO timestamp. */
  dateTime: string;
  /** Request time on the server, so the server and first client render agree. */
  serverNow: number;
  className?: string;
};

function useTimeParts({ dateTime, serverNow }: TimeProps, maxAgeUnits?: number) {
  const clientNow = useClientNow();
  const date = new Date(dateTime);
  const isClient = clientNow !== null;

  return {
    age: formatAge(date.getTime(), clientNow ?? serverNow, maxAgeUnits),
    /** Local time isn't knowable on the server, so it shows UTC until hydration. */
    timestamp: (format: TimestampFormat) =>
      formatTimestamp(date, format === "local" && !isClient ? "utc" : format),
  };
}

/** List cell: the age, with the local timestamp on hover. */
export function TradeTimeCell(props: TimeProps) {
  const { age, timestamp } = useTimeParts(props);

  return (
    <time dateTime={props.dateTime} title={timestamp("local")} className={props.className}>
      {age}
    </time>
  );
}

/**
 * Trade page, laid out like Etherscan: "🕒 34 days ago" then a button showing
 * the timestamp in the chosen format. The button opens "Time Formats", which
 * lists UTC, Local, and Unix Timestamp, each with a copy button; picking one
 * makes it the button's format. Like Etherscan, every visit starts on UTC.
 */
export function TradeTimestamp(props: TimeProps) {
  const { age, timestamp } = useTimeParts(props, 1);
  const [format, setFormat] = useState<TimestampFormat>("utc");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on a click outside or Escape, like a native menu.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
      <time dateTime={props.dateTime} className={`inline-flex items-center gap-1.5 ${props.className ?? ""}`}>
        <ClockIcon />
        {age}
      </time>
      <span ref={containerRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={`${timestamp(format)}, change time format`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-input px-3 py-1.5 transition-colors hover:border-muted focus-visible:border-muted"
        >
          {timestamp(format)}
          <ChevronIcon isOpen={isOpen} />
        </button>
        {isOpen && (
          <div
            id={menuId}
            className="panel absolute top-full left-0 z-20 mt-2 w-max max-w-[calc(100vw-60px)] bg-surface-menu text-left shadow-lg sm:right-0 sm:left-auto"
          >
            <p className="type-small px-4 pt-3 pb-2 font-semibold">Time Formats</p>
            <ul className="divide-y divide-border border-t border-border">
              {(Object.keys(timestampFormatLabels) as TimestampFormat[]).map((value) => (
                <li key={value} className="flex items-center gap-2 pr-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormat(value);
                      setIsOpen(false);
                      buttonRef.current?.focus();
                    }}
                    aria-current={value === format}
                    className="min-w-0 flex-1 cursor-pointer px-4 py-2.5 text-left transition-colors hover:bg-input focus-visible:bg-input"
                  >
                    <span className="type-small block text-muted">{timestampFormatLabels[value]}</span>
                    <span className="block whitespace-nowrap">{timestamp(value)}</span>
                  </button>
                  <CopyButton value={timestamp(value)} label={`Copy ${timestampFormatLabels[value]} time`} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </span>
    </span>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0 text-muted">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`size-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
