"use client";

import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper, { type StepperProps } from "@mui/material/Stepper";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import {
  accentStepMarkerClassName,
  stepperTheme,
} from "@/components/trade-step-graph/stepper-theme";
import { TradeStepText } from "@/components/trades/trade-step-text";
import type { TradeStepStatus } from "@/lib/trades";

export type TradeProgressStep = {
  label: string;
  status: TradeStepStatus;
  /** Shown from an info button beside the label. */
  description?: string;
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
 * stepper's theme and marker. Each step's label can carry an info button with
 * a description, and its content (passed in already rendered by the server)
 * stays expanded under it.
 */
export function TradeProgressStepper({
  steps,
}: {
  steps: TradeProgressStep[];
}) {
  const activeStep = steps.findIndex((step) => step.status === "current");

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

          return (
            // `expanded` keeps every step's content visible, not just the
            // active one's; `active` and `completed` override what MUI
            // would infer from `activeStep`.
            <Step
              key={step.label}
              component="li"
              expanded
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
                <TradeStepText
                  label={step.label}
                  description={step.description}
                  className={
                    step.status === "current"
                      ? "font-medium text-foreground"
                      : "text-muted"
                  }
                >
                  <span className="sr-only">{`, step ${index + 1}: ${statusText[step.status]}`}</span>
                </TradeStepText>
              </StepLabel>
              {step.content && <StepContent>{step.content}</StepContent>}
            </Step>
          );
        })}
      </Stepper>
    </ThemeProvider>
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
