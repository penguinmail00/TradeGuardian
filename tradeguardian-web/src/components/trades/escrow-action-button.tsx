"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useId, useRef } from "react";
import { BaseError, isAddressEqual, UserRejectedRequestError, type Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import { escrowAbi } from "@/lib/escrow-abi";

type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

const initialState: ActionState = { status: "idle" };

const alignClassNames = {
  start: { form: "items-start", message: "" },
  end: { form: "sm:items-end", message: "sm:text-right" },
} as const;

type Confirmation = {
  title: string;
  /** What the action will do, especially to the user's funds. */
  message: string;
  /** The dialog's confirm button, e.g. "Yes, report not received". */
  confirmLabel: string;
};

const variantClassNames = {
  primary: "btn-primary",
  destructive: "btn-destructive",
  success: "btn-success",
} as const;

/**
 * Calls one of the escrow's write functions from the connected wallet, waits
 * for the transaction to confirm, then refreshes the page. Only `account` may
 * call it, so other wallets get an error instead. With `confirmation`, the
 * button first opens a dialog explaining the action, and only its confirm
 * button sends the transaction.
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
  align = "end",
  confirmation,
}: {
  escrow: Address;
  /** The wallet that must send the transaction. */
  account: Address;
  functionName:
    | "sellerDeposit"
    | "buyerDeposit"
    | "withdraw"
    | "settle"
    | "setSellerHasGivenItem"
    | "setBuyerHasReceivedCorrectItem"
    | "setBuyerHasReceivedIncorrectItem";
  /** In wei; deposits must send the exact amount. */
  value?: bigint;
  /** Finishes "Connect your wallet to …", e.g. "deposit". */
  verb: string;
  label: string;
  pendingLabel: string;
  successMessage: string;
  variant?: keyof typeof variantClassNames;
  /** `end` for the actions below the trade panel; `start` inside a step. */
  align?: keyof typeof alignClassNames;
  confirmation?: Confirmation;
}) {
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
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

      // Re-reads the escrow's state (and the stored trades) everywhere it's shown.
      await queryClient.invalidateQueries();
      return { status: "success" };
    },
    initialState,
  );

  return (
    <form action={formAction} className={`flex flex-col gap-2 ${alignClassNames[align].form}`}>
      <button
        type={confirmation ? "button" : "submit"}
        onClick={confirmation ? () => dialogRef.current?.showModal() : undefined}
        aria-haspopup={confirmation ? "dialog" : undefined}
        className={`btn btn-lg ${variantClassNames[variant]} w-full sm:w-auto`}
        aria-busy={isPending}
        disabled={isPending || state.status === "success"}
      >
        {isPending ? pendingLabel : label}
      </button>
      {confirmation && (
        // Native modal: traps focus, closes on Escape, and returns focus to
        // the button. Its confirm button submits this form.
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={messageId}
          className="panel m-auto w-[calc(100%-32px)] max-w-md bg-surface-menu p-6 text-left text-foreground backdrop:bg-black/70"
        >
          <h2 id={titleId} className="type-h3">
            {confirmation.title}
          </h2>
          <p id={messageId} className="type-body mt-3 text-pretty text-muted">
            {confirmation.message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="btn btn-secondary w-full sm:w-auto"
              autoFocus
            >
              Go back
            </button>
            <button
              type="submit"
              onClick={() => dialogRef.current?.close()}
              className={`btn ${variantClassNames[variant]} w-full sm:w-auto`}
            >
              {confirmation.confirmLabel}
            </button>
          </div>
        </dialog>
      )}
      {state.status === "error" && (
        <p role="alert" className={`type-small text-danger ${alignClassNames[align].message}`}>
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className={`type-small text-green ${alignClassNames[align].message}`}>
          {successMessage}
        </p>
      )}
    </form>
  );
}
