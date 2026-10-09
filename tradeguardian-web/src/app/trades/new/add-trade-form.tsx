"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  BaseError,
  getAddress,
  isAddress,
  isAddressEqual,
  UserRejectedRequestError,
  type Address,
} from "viem";
import { useAccount, usePublicClient, useSignMessage } from "wagmi";

import { addTradeMessage } from "@/lib/add-trade-message";
import { BackendApiError } from "@/lib/backend-api";
import { escrowAbi } from "@/lib/escrow-abi";
import { addTradeToList } from "@/lib/trades-api";
import { tradesQueryKey } from "@/lib/use-trades";

type AddTradeState =
  | { status: "idle" }
  | { status: "error"; message: string; value: string };

const initialState: AddTradeState = { status: "idle" };

const inputId = "add-trade-escrow";
const errorId = `${inputId}-error`;

/**
 * Takes an escrow contract address and checks on-chain, on the wallet's
 * current network, that the connected wallet is that escrow's buyer or seller.
 * Then the wallet signs a message so the backend adds the trade to its list,
 * and the trade opens.
 */
export function AddTradeForm() {
  const { address: account, chain } = useAccount();
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const router = useRouter();
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

      if (!isAddressEqual(seller, account) && !isAddressEqual(buyer, account)) {
        return fail("Your connected wallet isn't the buyer or seller on this trade.");
      }

      // The wallet must sign before the trade can be added. Anyone can create
      // an escrow naming any wallet as buyer or seller, so being named isn't
      // enough: the backend only adds the trade to this wallet's list if this
      // wallet signed the request, which no one else can do. Signing happens
      // in the wallet and isn't a transaction, so it costs no gas.
      const issuedAt = new Date().toISOString();
      let signature;
      try {
        signature = await signMessageAsync({ message: addTradeMessage(escrow, account, issuedAt) });
      } catch (error) {
        if (error instanceof BaseError && error.walk((e) => e instanceof UserRejectedRequestError)) {
          return fail("Request rejected in your wallet.");
        }
        return fail(error instanceof BaseError ? error.shortMessage : "Couldn't sign the request. Try again.");
      }

      let added;
      try {
        added = await addTradeToList({ escrow, account, issuedAt, signature });
      } catch (error) {
        if (!(error instanceof BackendApiError)) throw error;
        return fail("Couldn't reach the server. Try again in a moment.");
      }
      if (!added.ok) return fail(added.message);

      // So My trades lists the added trade.
      await queryClient.invalidateQueries({ queryKey: tradesQueryKey });
      router.push(`/trades/${escrow}`);
      return initialState;
    },
    initialState,
  );

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

      <button
        type="submit"
        className="btn btn-lg btn-primary w-full sm:w-auto sm:self-start"
        aria-busy={isPending}
        disabled={isPending}
      >
        {isPending ? "Adding…" : "Add trade"}
      </button>
    </form>
  );
}
