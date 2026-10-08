/** A grey block standing in for content that's still loading. Size it with `className`. */
export function Placeholder({ className }: { className: string }) {
  return <div aria-hidden="true" className={`rounded-md bg-border/40 ${className}`} />;
}
