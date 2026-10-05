import type { ReactNode } from "react";

/**
 * One line of a per-side checklist (deposits, delivery, settlement): a filled
 * check once this side has done its part, an empty dashed circle until then,
 * or with `isFailed`, a red cross when its part went wrong (like a buyer
 * reporting the item not received).
 */
export function ChecklistItem({
  isDone,
  isFailed = false,
  children,
}: {
  isDone: boolean;
  isFailed?: boolean;
  children: ReactNode;
}) {
  const color = isFailed ? "text-danger" : isDone ? "text-green" : "text-muted";

  return (
    <li className={`type-small flex items-center gap-2 ${color}`}>
      {isFailed ? <CrossCircleIcon /> : isDone ? <CheckCircleIcon /> : <PendingCircleIcon />}
      {children}
    </li>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="m4.75 8.25 2.25 2.25 4.25-4.5"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="m5.5 5.5 5 5m0-5-5 5"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PendingCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2.75 2.75"
      />
    </svg>
  );
}
