import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Variable font: covers the 400–800 weights used, so no synthetic bold.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Headings, navigation and buttons. Only the weights the UI uses are loaded.
const rigidSquare = localFont({
  src: [
    {
      path: "./fonts/rigid-square-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    { path: "./fonts/rigid-square-bold.woff2", weight: "700", style: "normal" },
    {
      path: "./fonts/rigid-square-extrabold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-rigid-square",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeGuardian",
  description:
    "Trade with confidence. TradeGuardian protects every trade from start to finish.",
};

export const viewport: Viewport = {
  themeColor: "#111316",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${rigidSquare.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {/* Emits MUI's styles during SSR, inside @layer mui so Tailwind
            utilities can override them. */}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          {children}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
