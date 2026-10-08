"use client";

import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper, { type StepperProps } from "@mui/material/Stepper";
import { ThemeProvider } from "@mui/material/styles";
import { useId, useState, type ReactNode } from "react";

import {
  accentStepMarkerClassName,
  stepperTheme,
} from "@/components/trade-step-graph/stepper-theme";
import type { TradeStepStatus } from "@/lib/trades";

export type TradeProgressStep = {
  label: string;
  status: TradeStepStatus;
  /** Rendered under the label, e.g. a checklist or the trade's details. */
  content?: ReactNode;
};

const statusText: Record<TradeStepStatus, string> = {
  complete: "Complete",
  current: "Current step",
  upcoming: "Not started",
  failed: "Stopped",
};

// Same marker size as the home page's stepper.
const iconSize = 40;
// Space between an icon and its label.
const iconGap = 16;
// Space between an icon and its line, as on the home page's stepper.
const lineGap = 12;
// Vertical gap between one step's content and the next icon.
const rowGap = 32;

/**
 * MUI's connector only spans the gap between steps, so it can't run beside a
 * step's content. Each step draws its own 1px line instead, from below its
 * icon to just above the next one: solid cyan once the next step is reached,
 * grey until then (`data-next-reached` on the step).
 */
const sx: StepperProps["sx"] = {
  "& .MuiStepConnector-root": { display: "none" },
  "& .MuiStep-root": {
    position: "relative",
    pb: `${rowGap}px`,
    "&:last-of-type": { pb: 0 },
    "&:not(:last-of-type)::before": {
      content: '""',
      position: "absolute",
      top: `${iconSize + lineGap}px`,
      bottom: `${lineGap}px`,
      left: `${iconSize / 2}px`,
      width: "1px",
      // Centered with a -50% shift, like the home page's lines.
      transform: "translateX(-50%)",
      backgroundColor: "var(--border)",
    },
    '&[data-next-reached="true"]::before': { backgroundColor: "var(--accent)" },
  },
  "& .MuiStepLabel-root": { alignItems: "flex-start", p: 0 },
  "& .MuiStepLabel-iconContainer": { pr: `${iconGap}px` },
  "& .MuiStepContent-root": {
    ml: 0,
    mt: "8px",
    pl: `${iconSize + iconGap}px`,
    pr: 0,
    borderLeft: "none",
  },
};

/**
 * The trade's progress as MUI's vertical Stepper, sharing the home page
 * stepper's theme and marker. Each step's content (passed in already rendered)
 * sits under its label. Steps with content start open, and a
 * chevron button in the label row collapses or expands each one, except the
 * current step, which always stays open.
 */
export function TradeProgressStepper({
  steps,
}: {
  steps: TradeProgressStep[];
}) {
  const activeStep = steps.findIndex((step) => step.status === "current");
  const [openSteps, setOpenSteps] = useState(() => steps.map(() => true));
  const contentIdPrefix = useId();

  function toggleStep(index: number) {
    setOpenSteps((open) =>
      open.map((isOpen, i) => (i === index ? !isOpen : isOpen)),
    );
  }

  return (
    <ThemeProvider theme={stepperTheme}>
      <Stepper
        component="ol"
        aria-label="Trade progress"
        activeStep={activeStep}
        orientation="vertical"
        sx={sx}
      >
        {steps.map((step, index) => {
          const nextStatus = steps[index + 1]?.status;
          // The current step always stays open, so it has no chevron.
          const isCollapsible =
            Boolean(step.content) && step.status !== "current";
          const isOpen = !isCollapsible || (openSteps[index] ?? true);
          const contentId = `${contentIdPrefix}-${index}`;

          return (
            // `expanded` lets any step's content show, not just the active
            // one's; `active` and `completed` override what MUI would infer
            // from `activeStep`.
            <Step
              key={step.label}
              component="li"
              expanded={isOpen}
              active={step.status === "current"}
              completed={step.status === "complete"}
              aria-current={step.status === "current" ? "step" : undefined}
              data-next-reached={
                nextStatus !== undefined && nextStatus !== "upcoming"
              }
            >
              <StepLabel
                slots={{ stepIcon: ProgressStepIcon }}
                error={step.status === "failed"}
              >
                {/* As tall as the icon, so the label sits centred beside it. */}
                <span className="flex min-h-10 items-center gap-1">
                  <span
                    className={`type-body text-pretty ${
                      step.status === "current"
                        ? "font-medium text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {step.label}
                    <span className="sr-only">{`, step ${index + 1}: ${statusText[step.status]}`}</span>
                  </span>
                  {isCollapsible && (
                    <button
                      type="button"
                      onClick={() => toggleStep(index)}
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      aria-label={`${isOpen ? "Collapse" : "Expand"} ${step.label}`}
                      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-input hover:text-foreground focus-visible:bg-input focus-visible:text-foreground"
                    >
                      <ChevronIcon isOpen={isOpen} />
                    </button>
                  )}
                </span>
              </StepLabel>
              {step.content && (
                <StepContent id={contentId}>{step.content}</StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>
    </ThemeProvider>
  );
}

/** Points down while the step is open, right while it's collapsed. */
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const iconClassNames = {
  complete: "bg-accent text-on-accent",
  current: accentStepMarkerClassName,
  upcoming: "border border-border font-heading font-bold text-muted",
  failed: "border border-danger bg-danger/10 text-danger",
};

/**
 * Replaces MUI's filled circles: the home page's cyan marker for the current
 * step, a check on a solid cyan disc once complete, a red cross when
 * stopped, and a grey number until reached.
 */
function ProgressStepIcon({ active, completed, error, icon }: StepIconProps) {
  const status = error
    ? "failed"
    : completed
      ? "complete"
      : active
        ? "current"
        : "upcoming";

  return (
    <span
      className={`flex size-10 items-center justify-center rounded-full ${iconClassNames[status]}`}
    >
      {status === "complete" ? (
        <CheckIcon />
      ) : status === "failed" ? (
        <CrossIcon />
      ) : (
        icon
      )}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-5" aria-hidden="true">
      <path
        d="m3.75 8.25 2.75 2.75 5.75-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
