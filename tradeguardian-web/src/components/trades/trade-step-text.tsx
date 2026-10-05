"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A step's label, and for steps with a `description`, an info button beside
 * it that shows or hides the description underneath.
 */
export function TradeStepText({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description?: string;
  /** Label text styles, which depend on the step's status. */
  className: string;
  /** Extra label content, like screen reader text. */
  children?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const descriptionId = useId();

  return (
    <div className="flex min-w-0 flex-col">
      <span className={`type-body flex min-h-10 items-center gap-1 text-pretty ${className}`}>
        <span>
          {label}
          {children}
        </span>
        {description && (
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={descriptionId}
            aria-label={`About ${label}`}
            className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-input hover:text-foreground focus-visible:bg-input focus-visible:text-foreground ${
              isOpen ? "text-foreground" : "text-muted"
            }`}
          >
            <InfoIcon />
          </button>
        )}
      </span>
      {description && (
        <p
          id={descriptionId}
          hidden={!isOpen}
          className="type-small max-w-[50ch] text-pretty text-muted"
        >
          {description}
        </p>
      )}
    </div>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
