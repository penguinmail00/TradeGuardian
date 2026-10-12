import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/**
 * Logo shield on the right of the hero, with a sword and a bag of gold
 * orbiting it on a tilted ellipse: they pass in front of the shield on the
 * near side and behind it on the far side. Pure CSS (keyframes in
 * globals.css). Under reduced motion both rest at the ellipse's sides.
 */
export function HeroShield({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none isolate w-[240px] ${className ?? ""}`}
    >
      <Image
        src="/images/tradeguardian.svg"
        alt=""
        width={444}
        height={501}
        preload
        className="relative z-10 block w-full drop-shadow-[0_0_40px_rgb(0_195_255/0.35)]"
      />
      {/* Half an orbit apart, so they stay on opposite sides. */}
      <Orbiter phase="0s" restX="-200px">
        <SwordIcon />
      </Orbiter>
      <Orbiter phase="-4s" restX="200px">
        <GoldBagIcon />
      </Orbiter>
    </div>
  );
}

/**
 * Splits the orbit into two eased back-and-forth motions a quarter turn
 * apart: the outer element moves in depth (up/back, down/front, scale,
 * stacking), the inner one side to side. Together they trace an ellipse.
 */
function Orbiter({
  phase,
  restX,
  children,
}: {
  /** Animation delay placing the item on the orbit. */
  phase: string;
  /** Resting side-to-side offset under reduced motion. */
  restX: string;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-10 m-auto size-[80px] animate-orbit-depth"
      style={{ "--orbit-phase": phase } as CSSProperties}
    >
      <div
        className="size-full animate-orbit-x drop-shadow-[0_6px_12px_rgb(0_0_0/0.45)]"
        style={{ transform: `translateX(${restX})` }}
      >
        {children}
      </div>
    </div>
  );
}

function SwordIcon() {
  return (
    <svg viewBox="0 0 64 64" className="size-full">
      <g transform="rotate(45 32 32)">
        <path d="M32 2l4 7v31h-4z" fill="#a9b5c1" />
        <path d="M32 2l-4 7v31h4z" fill="#eef3f7" />
        <path d="M32 11v27" stroke="#7d8a97" strokeWidth={1} />
        <rect x={21} y={40} width={22} height={4} rx={2} fill="#e8b810" />
        <rect x={30} y={44} width={4} height={12} fill="#6b4a2b" />
        <path d="M30 47h4M30 50h4M30 53h4" stroke="#4a3220" strokeWidth={1} />
        <circle cx={32} cy={59} r={3.5} fill="#e8b810" />
      </g>
    </svg>
  );
}

function GoldBagIcon() {
  return (
    <svg viewBox="0 0 64 64" className="size-full">
      <path d="M24 23l-7-11 11 4 4-7 4 7 11-4-7 11z" fill="#d9a441" />
      <path d="M22 27C11 35 8 57 23 59h18c15-2 12-24 1-32z" fill="#d9a441" />
      <path d="M32 27h10c11 8 14 30-1 32h-9z" fill="#b9832c" />
      <rect x={22} y={22} width={20} height={6} rx={3} fill="#8a5a1e" />
      <circle
        cx={32}
        cy={44}
        r={8}
        fill="#e8b810"
        stroke="#9a7a08"
        strokeWidth={2}
      />
      <circle cx={32} cy={44} r={3.5} stroke="#9a7a08" strokeWidth={1.5} />
    </svg>
  );
}
