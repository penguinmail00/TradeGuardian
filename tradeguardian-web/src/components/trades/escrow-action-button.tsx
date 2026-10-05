"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { BaseError, isAddressEqual, UserRejectedRequestError, type Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import { escrowAbi } from "@/lib/escrow-abi";

type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

const initialState: ActionState = { status: "idle" };

const variantClassNames = {
  primary: "btn-primary",
  destructive: "btn-destructive",
} as const;

/**
 * Calls one of the escrow's write functions from the connected wallet, waits
 * for the transaction to confirm, then refreshes the page. Only `account` may
 * call it, so other wallets get an error instead.
 */
export function EscrowActionButton({
  escrow,
  account,
  functionName,
  value,
  verb,
  label,
  pendingLabel,
  successMessage,
  variant = "primary",
}: {
  escrow: Address;
  /** The wallet that must send the transaction. */
  account: Address;
  functionName: "sellerDeposit" | "buyerDeposit" | "withdraw" | "settle";
  /** In wei; deposits must send the exact amount. */
  value?: bigint;
  /** Finishes "Connect your wallet to …", e.g. "deposit". */
  verb: string;
  label: string;
  pendingLabel: string;
  successMessage: string;
  variant?: keyof typeof variantClassNames;
}) {
  const router = useRouter();
  const { address: connected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [state, formAction, isPending] = useActionState(
    async (): Promise<ActionState> => {
      const fail = (message: string): ActionState => ({ status: "error", message });

      if (!connected || !publicClient) return fail(`Connect your wallet to ${verb}.`);
      if (!isAddressEqual(connected, account)) {
        return fail(`Switch to ${account} in your wallet to ${verb}.`);
      }

      try {
        const hash = await (functionName === "sellerDeposit" || functionName === "buyerDeposit"
          ? writeContractAsync({ address: escrow, abi: escrowAbi, functionName, value })
          : writeContractAsync({ address: escrow, abi: escrowAbi, functionName }));
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") return fail("The transaction failed.");
      } catch (error) {
        if (error instanceof BaseError && error.walk((e) => e instanceof UserRejectedRequestError)) {
          return fail("Request rejected in your wallet.");
        }
        return fail(
          error instanceof BaseError ? error.shortMessage : "Couldn't send the transaction. Try again.",
        );
      }

      router.refresh();
      return { status: "success" };
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:items-end">
      <button
        type="submit"
        className={`btn btn-lg ${variantClassNames[variant]} w-full sm:w-auto`}
        aria-busy={isPending}
        disabled={isPending || state.status === "success"}
      >
        {isPending ? pendingLabel : label}
      </button>
      {state.status === "error" && (
        <p role="alert" className="type-small text-danger sm:text-right">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="type-small text-green sm:text-right">
          {successMessage}
        </p>
      )}
    </form>
  );
}
