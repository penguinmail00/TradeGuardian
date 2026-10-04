import Link from "next/link";

/** "← My trades", shown above the heading on pages under /trades. */
export function BackToTradesLink() {
  return (
    <Link href="/trades" className="type-small text-muted transition-colors hover:text-foreground">
      ← My trades
    </Link>
  );
}
