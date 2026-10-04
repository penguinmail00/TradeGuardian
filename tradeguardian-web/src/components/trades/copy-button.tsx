"use client";

import { useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

const resetDelayMs = 2000;

/**
 * Icon button that copies `value` to the clipboard and briefly shows a check
 * mark. `label` names what is copied, e.g. "Copy contract address".
 */
export function CopyButton({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function handleCopy() {
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      // Clipboard access is denied outside secure contexts or by permissions.
      setStatus("failed");
    }
    resetTimer.current = setTimeout(() => setStatus("idle"), resetDelayMs);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={status === "failed" ? "Couldn't copy" : label}
      className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-input hover:text-foreground focus-visible:bg-input focus-visible:text-foreground ${className}`}
    >
      {status === "copied" ? <CheckIcon /> : <CopyIcon />}
      <span aria-live="polite" className="sr-only">
        {status === "copied" ? "Copied" : status === "failed" ? "Couldn't copy" : ""}
      </span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-green">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
