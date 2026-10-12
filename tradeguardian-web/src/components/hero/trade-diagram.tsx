type Party = {
  label: string;
  x: number;
};

type Point = [x: number, y: number];

type Line = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Breaks in the line, so it doesn't run through the icons on it. */
  gaps: { center: Point; r: number }[];
};

const NODE_Y = 70;
const NODE_RADIUS = 30;

const buyer: Party = { label: "Buyer", x: 70 };
const seller: Party = { label: "Seller", x: 410 };

// Icons sit on the lines they travel along: the traded items midway between
// the parties, and each party's coins (the payment) midway along its line to
// the shield.
const ITEMS_X = (buyer.x + seller.x) / 2;
const sword = { center: [ITEMS_X - 15, NODE_Y] as Point, size: 36 };
const gem = { center: [ITEMS_X + 18, NODE_Y] as Point, size: 32 };
// As in Escrow.sol, the buyer deposits twice the price and the seller the
// price: two coins and one.
const buyerCoins = { center: [148, 143] as Point, count: 2 as const };
const sellerCoins = { center: [333, 143] as Point, count: 1 as const };
const COIN_STACK_SIZE = 34;

/** Line gap around a coin icon; a single coin is narrower than the stack. */
function coinGap({ center, count }: { center: Point; count: number }) {
  return {
    center,
    r: COIN_STACK_SIZE * (count === 2 ? 0.5 : 0.38) + GAP_MARGIN,
  };
}
/** Clear space around an icon where its line breaks. */
const GAP_MARGIN = 4;

// Each line runs the way things flow: the item from seller to buyer, the
// money from each party into the shield. Their dashes drift from start to
// end. The lines into the shield end just inside it, under its edge.
const lines: Line[] = [
  {
    id: "seller-buyer",
    x1: seller.x,
    y1: NODE_Y,
    x2: buyer.x,
    y2: NODE_Y,
    gaps: [sword, gem].map((item) => ({
      center: item.center,
      r: item.size / 2 - 2 + GAP_MARGIN,
    })),
  },
  {
    id: "buyer-shield",
    x1: buyer.x,
    y1: NODE_Y,
    x2: 225,
    y2: 215,
    gaps: [coinGap(buyerCoins)],
  },
  {
    id: "seller-shield",
    x1: seller.x,
    y1: NODE_Y,
    x2: 255,
    y2: 215,
    gaps: [coinGap(sellerCoins)],
  },
];

// Logo path (444x501) scaled to 150x169 and centered under the parties.
const SHIELD_TRANSFORM = "translate(165 185) scale(0.3378)";
const SHIELD_PATH =
  "M0.710022 72.41L222.16 0.109985L443.62 72.41V233.69C443.62 305.98 380.35 433.89 222.16 500.63C63.98 433.89 0.710022 305.98 0.710022 233.69V72.41Z";
const SHIELD_RIGHT_HALF_PATH =
  "M443.62 72.41L222.16 0.109985V500.63C380.35 433.89 443.62 305.98 443.62 233.69V72.41Z";

/**
 * Buyer and seller joined through the TradeGuardian shield by dashed lines.
 * The traded items (a sword and a gem) sit midway along the seller-to-buyer
 * line, and the payment along each line into the shield (two coins from the
 * buyer, one from the seller), each line breaking around them. The dashes
 * drift along the lines: seller to buyer, and each party into the shield.
 * Pure SVG + CSS (keyframes in globals.css), so it renders on the server.
 * Under reduced motion it's a still diagram.
 */
export function TradeDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="hero-shield-gradient"
          x1="385.26"
          y1="-34.78"
          x2="216.61"
          y2="493.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.02" stopColor="#00c3ff" />
          <stop offset="0.08" stopColor="#58d8ff" />
          <stop offset="0.16" stopColor="#c3f1ff" />
          <stop offset="0.42" stopColor="#58d8ff" />
          <stop offset="0.68" stopColor="#20cbff" />
          <stop offset="0.9" stopColor="#00c3ff" />
        </linearGradient>
        {/* Each line's mask: the line in white, with black gaps cut around
            the icons on it. */}
        {lines.map((line) => (
          <mask
            key={line.id}
            id={`hero-line-${line.id}`}
            maskUnits="userSpaceOnUse"
          >
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="white"
              strokeWidth={8}
            />
            {line.gaps.map(({ center: [cx, cy], r }) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="black" />
            ))}
          </mask>
        ))}
      </defs>

      {lines.map((line) => (
        <line
          key={line.id}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          mask={`url(#hero-line-${line.id})`}
          strokeWidth={2}
          strokeDasharray="4 6"
          className="trade-diagram-flow stroke-accent/50"
        />
      ))}

      <g transform={SHIELD_TRANSFORM}>
        <path d={SHIELD_PATH} className="fill-accent" />
        <path d={SHIELD_RIGHT_HALF_PATH} fill="url(#hero-shield-gradient)" />
      </g>

      {[buyer, seller].map((party) => (
        <PartyNode key={party.label} party={party} />
      ))}

      <g>
        <Sword x={sword.center[0]} y={sword.center[1]} size={sword.size} />
        <Gem x={gem.center[0]} y={gem.center[1]} size={gem.size} />
        {[buyerCoins, sellerCoins].map(({ center: [x, y], count }) => (
          <Coins
            key={`${x}-${y}`}
            x={x}
            y={y}
            size={COIN_STACK_SIZE}
            count={count}
          />
        ))}
      </g>
    </svg>
  );
}

function PartyNode({ party }: { party: Party }) {
  return (
    <g>
      <circle
        cx={party.x}
        cy={NODE_Y}
        r={NODE_RADIUS}
        className="fill-surface stroke-border"
        strokeWidth={2}
      />
      <g className="stroke-muted" strokeWidth={2} strokeLinecap="round">
        <circle cx={party.x} cy={NODE_Y - 7} r={6} />
        <path d={`M${party.x - 11} ${NODE_Y + 14}a11 11 0 0 1 22 0`} />
      </g>
      <text
        x={party.x}
        y={NODE_Y + NODE_RADIUS + 24}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        letterSpacing="0.08em"
        className="font-heading fill-muted"
      >
        {party.label.toUpperCase()}
      </text>
    </g>
  );
}

/** Diagonal sword centered on (x, y), drawn on a 64-unit grid. */
function Sword({ x, y, size }: { x: number; y: number; size: number }) {
  const scale = size / 64;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}>
      <g transform="rotate(45 32 32)">
        <path d="M32 2l4 7v31h-4z" fill="#a9b5c1" />
        <path d="M32 2l-4 7v31h4z" fill="#eef3f7" />
        <path d="M32 11v27" stroke="#7d8a97" strokeWidth={1} />
        <rect x={21} y={40} width={22} height={4} rx={2} fill="#e8b810" />
        <rect x={30} y={44} width={4} height={12} fill="#6b4a2b" />
        <path d="M30 47h4M30 50h4M30 53h4" stroke="#4a3220" strokeWidth={1} />
        <circle cx={32} cy={59} r={3.5} fill="#e8b810" />
      </g>
    </g>
  );
}

/**
 * Faceted emerald centered on (x, y), drawn on a 64-unit grid, in shades of
 * the brand green (#00b093).
 */
function Gem({ x, y, size }: { x: number; y: number; size: number }) {
  const scale = size / 64;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}>
      <path d="M8 22l10-10 6 10z" fill="#c8f7e9" />
      <path d="M18 12h28l-6 10H24z" fill="#8eecd2" />
      <path d="M46 12l10 10H40z" fill="#3fd6ae" />
      <path d="M8 22h16l8 32z" fill="#10b98a" />
      <path d="M24 22h16l-8 32z" fill="#8eecd2" />
      <path d="M40 22h16L32 54z" fill="#00936f" />
    </g>
  );
}

/**
 * Thick coins in perspective, centered on (x, y) and drawn on a 64-unit grid:
 * one lying flat, with a second tilted against it for a stack of two.
 */
function Coins({
  x,
  y,
  size,
  count,
}: {
  x: number;
  y: number;
  size: number;
  /** 2 for a stack; 1 for the flat coin alone, recentered. */
  count: 1 | 2;
}) {
  const scale = size / 64;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}>
      <g transform={count === 1 ? "translate(-5 -12.5)" : undefined}>
        <Coin3d
          side="M14 40v9a23 9 0 0 0 46 0v-9a23 9 0 0 1-46 0z"
          ridges="M17.3 47.3v4M23.9 50.1v4M30.4 51.3v4M37 51.7v4M43.6 51.3v4M50.1 50.1v4M56.7 47.3v4"
          face={{ cx: 37, cy: 40, rx: 23, ry: 9 }}
        />
      </g>
      {count === 2 && (
        <g transform="rotate(-24 27 27)">
          <Coin3d
            side="M6 24v8.5a21 8.5 0 0 0 42 0V24a21 8.5 0 0 1-42 0z"
            ridges="M9 30.9v3.8M15 33.5v3.8M21 34.7v3.8M27 35v3.8M33 34.7v3.8M39 33.5v3.8M45 30.9v3.8"
            face={{ cx: 27, cy: 24, rx: 21, ry: 8.5 }}
          />
        </g>
      )}
    </g>
  );
}

/**
 * One coin: its ridged edge, then its face with an inner recess, in the gold
 * of the sword's guard (#e8b810) with a lighter face and darker edge.
 */
function Coin3d({
  side,
  ridges,
  face,
}: {
  side: string;
  ridges: string;
  face: { cx: number; cy: number; rx: number; ry: number };
}) {
  return (
    <>
      <path d={side} fill="#c99a0b" />
      <path d={ridges} stroke="#8a6a06" strokeWidth={2} strokeLinecap="round" />
      <ellipse {...face} fill="#f5d24a" />
      <ellipse
        cx={face.cx}
        cy={face.cy}
        rx={face.rx * 0.78}
        ry={face.ry * 0.7}
        fill="#e8b810"
      />
    </>
  );
}
