"use client";

import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper, { type StepperProps } from "@mui/material/Stepper";
import { ThemeProvider } from "@mui/material/styles";

import {
  accentStepMarkerClassName,
  getLineGradient,
  stepperTheme,
} from "@/components/trade-step-graph/stepper-theme";

export type TradeStep = {
  title: string;
  description: string;
};

const iconSize = 40;
// Space between a step icon and its connector line or label text.
const iconGap = 12;
// Horizontal gap between step columns.
const columnGap = 24;
// Vertical gap between the end of one step's text and the next icon.
const rowGap = 32;

// Pulls each description up so it starts 8px under its title: the title's
// 8px offset plus its 19px line end 27px down the 40px icon, so the
// description starts at 35px, 5px above the icon's bottom edge.
const descriptionOverlap = 5;

/**
 * Vertical layout: title beside the icon, description below it, with a line
 * running down the left edge beside the text, from `iconGap` below one icon
 * to `iconGap` above the next.
 *
 * The line is drawn by each step's StepContent rather than MUI's connector:
 * the connector only spans the space between steps, so a gradient split
 * across the two would not fade evenly.
 */
const verticalSx: StepperProps["sx"] = {
  "& .MuiStepLabel-vertical": {
    alignItems: "flex-start",
    pt: `${iconGap}px`,
    pb: 0,
  },
  "& .MuiStepLabel-labelContainer": { pt: "8px" },
  "& .MuiStepLabel-iconContainer": { pr: "20px" },
  "& .MuiStepConnector-vertical": { display: "none" },
  "& .MuiStepContent-root": {
    position: "relative",
    ml: `${iconSize / 2}px`,
    mt: `-${descriptionOverlap}px`,
    // Lines the description up with the title (icon + 20px).
    pl: `${iconSize / 2 + 20}px`,
    pr: 0,
    // With the next label's top padding, this makes up the gap between steps.
    pb: `${rowGap - iconGap}px`,
    borderLeft: "none",
    // Centered on the icon with a -50% shift, so the 1px line anti-aliases
    // the same way as the rest of the site's centered rules.
    "&::before": {
      content: '""',
      position: "absolute",
      top: `${descriptionOverlap + iconGap}px`,
      bottom: 0,
      left: 0,
      width: "1px",
      transform: "translateX(-50%)",
      backgroundImage: getLineGradient("bottom"),
    },
  },
  "& .MuiStepContent-last": { pb: 0, "&::before": { display: "none" } },
};

/**
 * Horizontal layout: equal columns with left-aligned text under each icon.
 * MUI places each connector inside the following step, so it is positioned
 * back across the column gap: from `iconGap` past the previous icon to
 * `iconGap` into the gap before this step.
 */
function getHorizontalSx(stepCount: number): StepperProps["sx"] {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${stepCount}, minmax(0, 1fr))`,
    columnGap: `${columnGap}px`,
    "& .MuiStepConnector-alternativeLabel": {
      top: iconSize / 2,
      left: `calc(-100% - ${columnGap}px + ${iconSize + iconGap}px)`,
      right: `calc(100% + ${columnGap - iconGap}px)`,
    },
    "& .MuiStepConnector-line": {
      height: "1px",
      border: "none",
      backgroundImage: getLineGradient("right"),
    },
    "& .MuiStepLabel-alternativeLabel": { alignItems: "flex-start" },
    "& .MuiStepLabel-labelContainer": { textAlign: "left" },
    "& .MuiStepLabel-label.MuiStepLabel-alternativeLabel": { mt: "20px" },
  };
}

/**
 * Trade lifecycle rendered with MUI's Stepper. Both orientations are rendered
 * and toggled with CSS (vertical below md, horizontal from md) so the server
 * HTML is correct at every width, with no layout shift on hydration.
 */
export function TradeStepper({ steps }: { steps: TradeStep[] }) {
  return (
    <ThemeProvider theme={stepperTheme}>
      {/* activeStep={-1}: this is an explainer, not a progress tracker, so
          no step is highlighted as current or completed. */}
      <Stepper
        component="ol"
        activeStep={-1}
        orientation="vertical"
        className="mt-7 md:hidden"
        sx={verticalSx}
      >
        {steps.map((step) => (
          // `expanded` keeps every step's content visible, not just the active one.
          <Step key={step.title} component="li" expanded>
            <StepLabel slots={{ stepIcon: TradeStepIcon }}>
              <StepTitle>{step.title}</StepTitle>
            </StepLabel>
            <StepContent>
              <StepDescription>{step.description}</StepDescription>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      <Stepper
        component="ol"
        activeStep={-1}
        alternativeLabel
        className="mt-10 hidden md:grid lg:mt-12"
        sx={getHorizontalSx(steps.length)}
      >
        {steps.map((step) => (
          <Step key={step.title} component="li">
            <StepLabel
              slots={{ stepIcon: TradeStepIcon }}
              optional={
                <StepDescription className="mt-2">
                  {step.description}
                </StepDescription>
              }
            >
              <StepTitle>{step.title}</StepTitle>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </ThemeProvider>
  );
}

/**
 * MUI renders the label as nested spans, where an <h3> would be invalid HTML,
 * so the title is exposed to assistive tech as a heading via ARIA instead.
 */
function StepTitle({ children }: { children: string }) {
  return (
    <span role="heading" aria-level={3} className="type-h3 block text-foreground">
      {children}
    </span>
  );
}

function StepDescription({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`type-body block text-muted ${className}`}>
      {children}
    </span>
  );
}

/** Numbered cyan marker replacing MUI's default filled circle. */
function TradeStepIcon({ icon }: StepIconProps) {
  return (
    <span className={`flex size-10 items-center justify-center rounded-full ${accentStepMarkerClassName}`}>
      {icon}
    </span>
  );
}
