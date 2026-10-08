"use client";

import { useEffect } from "react";

/**
 * Shown under the layout's back link, heading and explorer link if the trade
 * panel crashes while rendering. A backend that can't be reached is handled
 * in `TradeView` instead. The explorer link above still works, since it only
 * needs the address in the URL.
 */
export default function TradeError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="panel mt-10 flex flex-col items-start gap-4 px-5 py-6 lg:px-6">
      <p className="type-body text-muted">This trade couldn’t be loaded. Check your connection and try again.</p>
      <button type="button" onClick={retry} className="btn btn-secondary">
        Try again
      </button>
    </div>
  );
}
