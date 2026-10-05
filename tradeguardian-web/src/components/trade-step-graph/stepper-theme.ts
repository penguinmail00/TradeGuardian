import { createTheme } from "@mui/material/styles";

// Mirrors the design tokens in globals.css; MUI needs literal colors to derive
// its palette variants. Shared by every MUI Stepper on the site.
export const stepperTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00c3ff" },
    success: { main: "#00b093" },
    error: { main: "#ff5c5c" },
    text: { primary: "#ffffff", secondary: "#b5bdc2" },
    divider: "#2b2e36",
  },
  typography: { fontFamily: "var(--font-sans)" },
});

/** The home page's cyan, glowing step marker; also the trade page's current step. */
export const accentStepMarkerClassName =
  "border border-accent bg-tint-cyan font-heading font-bold text-accent shadow-[0_0_24px_rgb(0_195_255/0.25)]";

/**
 * Connector lines fade from the accent into the border color, matching
 * Tailwind's `bg-linear-to-* from-accent/70 to-border`.
 */
export function getLineGradient(direction: "bottom" | "right") {
  return `linear-gradient(to ${direction} in oklab, color-mix(in oklab, var(--accent) 70%, transparent), var(--border))`;
}
