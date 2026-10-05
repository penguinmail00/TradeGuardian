import type { Address, Hash } from "viem";

import { CopyButton } from "@/components/trades/copy-button";

/**
 * Full address or transaction hash so it can be checked character by
 * character. Pass `copyLabel` to show a copy button. `isSingleLine` keeps it
 * on one line no wider than an address (42 characters), cutting out the
 * middle with an ellipsis but always keeping the last 4 characters, like
 * `shortenAddress`; the full value stays in the tooltip and the copy button.
 */
export function AddressValue({
  address,
  copyLabel,
  isSingleLine = false,
}: {
  address: Address | Hash;
  copyLabel?: string;
  isSingleLine?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      {isSingleLine ? (
        <span title={address} className="flex min-w-0 max-w-[42ch] font-mono">
          <span className="truncate">{address.slice(0, -4)}</span>
          <span className="shrink-0">{address.slice(-4)}</span>
        </span>
      ) : (
        <span className="min-w-0 font-mono break-all text-balance">
          {address}
        </span>
      )}
      {copyLabel && <CopyButton value={address} label={copyLabel} />}
    </span>
  );
}
