"use client";

import { useActionState } from "react";
import { getAddress, isAddress, isAddressEqual, type Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { escrowAbi } from "@/lib/escrow-abi";

type AddTradeState =
  | { status: "idle" }
  | { status: "error"; message: string; value: string }
  | { status: "success"; escrow: Address; account: Address; role: "buyer" | "seller" };

const initialState: AddTradeState = { status: "idle" };

const inputId = "add-trade-escrow";
const errorId = `${inputId}-error`;

/**
 * Takes an escrow contract address and checks on-chain, on the wallet's
 * current network, that the connected wallet is that escrow's buyer or seller.
 */
export function AddTradeForm() {
  const { address: account, chain } = useAccount();
  const publicClient = usePublicClient();
  const networkName = chain?.name ?? "this network";

  const [state, formAction, isPending] = useActionState(
    async (_previous: AddTradeState, formData: FormData): Promise<AddTradeState> => {
      const value = String(formData.get("escrow") ?? "").trim();
      const fail = (message: string): AddTradeState => ({ status: "error", message, value });

      if (!account || !publicClient) return fail("Connect your wallet to add a trade.");
      if (!isAddress(value, { strict: false })) {
        return fail("Enter a contract address: 0x followed by 40 letters and numbers.");
      }
      const escrow = getAddress(value);

      let code;
      try {
        code = await publicClient.getCode({ address: escrow });
      } catch {
        return fail(`Couldn't reach ${networkName}. Try again in a moment.`);
      }
      if (!code) {
        return fail(
          `There's no contract at this address on ${networkName}. Check the address, and that your wallet is on the right network.`,
        );
      }

      let seller: Address;
      let buyer: Address;
      try {
        [seller, buyer] = await Promise.all([
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "seller" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "buyer" }),
        ]);
      } catch {
        return fail("This contract isn't a TradeGuardian escrow.");
      }

      if (isAddressEqual(seller, account)) return { status: "success", escrow, account, role: "seller" };
      if (isAddressEqual(buyer, account)) return { status: "success", escrow, account, role: "buyer" };
      return fail("Your connected wallet isn't the buyer or seller on this trade.");
    },
    initialState,
  );

  // A result only counts for the wallet that was checked.
  const isSuccess =
    state.status === "success" && account !== undefined && isAddressEqual(state.account, account);
  const error = state.status === "error" ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="panel flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="sr-only">
          Contract address
        </label>
        <input
          id={inputId}
          name="escrow"
          type="text"
          inputMode="text"
          placeholder="Contract address"
          autoComplete="off"
          spellCheck={false}
          defaultValue={state.status === "error" ? state.value : undefined}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="field font-mono placeholder:font-sans"
        />
        {error && (
          <p id={errorId} role="alert" className="type-small text-danger">
            {error}
          </p>
        )}
      </div>

      {isSuccess && (
        <p role="status" className="type-small text-green">
          You&apos;re the {state.role} on this trade.
        </p>
      )}

      <button
        type="submit"
        className="btn btn-lg btn-primary w-full sm:w-auto sm:self-start"
        aria-busy={isPending}
        disabled={isPending}
      >
        {isPending ? "Checking…" : "Add trade"}
      </button>
    </form>
  );
}
