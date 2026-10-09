"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import {
  BaseError,
  getAddress,
  isAddress,
  isAddressEqual,
  parseEther,
  parseEventLogs,
  UserRejectedRequestError,
  type Address,
} from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import { escrowFactoryAbi, escrowFactoryAddress, escrowFactoryChain } from "@/lib/escrow-factory";
import { addPendingTradeSave, removePendingTradeSave } from "@/lib/pending-trade-saves";
import { tradesQueryKey } from "@/lib/use-trades";
import { wagmiConfig } from "@/lib/wagmi-config";

import { itemDetailsLimits, itemDetailsSchema } from "./create-trade";
import { saveCreatedTrade } from "./save-created-trade";

type FieldName = "itemName" | "description" | "role" | "counterparty" | "price";
type FieldErrors = Partial<Record<FieldName, string>>;
type Role = "seller" | "buyer";

type CreateTradeState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors: FieldErrors;
      /** Echoed back so the fields keep what the user typed. */
      values: Partial<Record<FieldName, string>>;
    };

const initialState: CreateTradeState = { status: "idle" };

/**
 * Creates an escrow through the factory from the connected wallet, waits for
 * it to confirm, saves the item's name and description, then opens the new
 * trade's page. The connected wallet is the buyer or seller, as chosen, and
 * the counterparty is the other side.
 */
export function CreateTradeForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address: account, chainId } = useAccount();
  const priceChain = getPriceChain(chainId);
  const publicClient = usePublicClient({ chainId: escrowFactoryChain.id });
  const { writeContractAsync } = useWriteContract();
  // Shared by both role pickers, which always show opposite sides.
  const [role, setRole] = useState<Role>();

  const [state, formAction, isPending] = useActionState(
    async (_previous: CreateTradeState, formData: FormData): Promise<CreateTradeState> => {
      const values = Object.fromEntries(
        (["itemName", "description", "role", "counterparty", "price"] as const).map((name) => {
          const value = formData.get(name);
          return [name, typeof value === "string" ? value : ""];
        }),
      ) as Record<FieldName, string>;
      const fail = (fieldErrors: FieldErrors, message?: string): CreateTradeState => ({
        status: "error",
        message,
        fieldErrors,
        values,
      });

      // Check every field first, so all their errors show at once.
      const fieldErrors: FieldErrors = {};
      const details = itemDetailsSchema.safeParse(values);
      if (!details.success) {
        for (const issue of details.error.issues) {
          const name = issue.path[0] as FieldName;
          fieldErrors[name] ??= issue.message;
        }
      }
      const role: Role | undefined =
        values.role === "seller" || values.role === "buyer" ? values.role : undefined;
      if (!role) fieldErrors.role = "Choose whether you're the buyer or the seller.";
      const counterpartyValue = values.counterparty.trim();
      if (!isAddress(counterpartyValue, { strict: false })) {
        fieldErrors.counterparty = "Invalid wallet address.";
      } else if (account && isAddressEqual(counterpartyValue, account)) {
        fieldErrors.counterparty = "Enter counterparty wallet address, not your own.";
      }
      const itemPrice = parsePrice(values.price);
      if (itemPrice === undefined) fieldErrors.price = "Enter an item price above 0, like 0.5.";

      if (!details.success || !role || itemPrice === undefined || Object.keys(fieldErrors).length > 0) {
        return fail(fieldErrors);
      }

      if (!account || !publicClient) return fail({}, "Connect your wallet to create a trade.");
      if (!escrowFactoryAddress) {
        return fail({}, "Creating trades isn't set up yet: the escrow factory address is missing.");
      }
      if (chainId !== escrowFactoryChain.id) {
        return fail({}, `Switch your wallet to ${escrowFactoryChain.name} to create a trade.`);
      }

      const counterparty = getAddress(counterpartyValue);
      const [seller, buyer]: [Address, Address] =
        role === "seller" ? [account, counterparty] : [counterparty, account];

      let transactionHash;
      let escrow: Address | undefined;
      try {
        transactionHash = await writeContractAsync({
          address: escrowFactoryAddress,
          abi: escrowFactoryAbi,
          functionName: "createEscrow",
          args: [seller, buyer, itemPrice],
          chainId: escrowFactoryChain.id,
        });
        // From here the escrow can exist without saved details, so keep them
        // until the save succeeds, in case the page closes first.
        addPendingTradeSave(account, { transactionHash, ...details.data, sentAt: Date.now() });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
        if (receipt.status !== "success") {
          removePendingTradeSave(account, transactionHash);
          return fail({}, "The transaction failed.");
        }
        [escrow] = parseEventLogs({
          abi: escrowFactoryAbi,
          eventName: "EscrowCreated",
          logs: receipt.logs,
        }).map((log) => log.args.escrow);
      } catch (error) {
        if (error instanceof BaseError && error.walk((e) => e instanceof UserRejectedRequestError)) {
          return fail({}, "Request rejected in your wallet.");
        }
        return fail(
          {},
          error instanceof BaseError ? error.shortMessage : "Couldn't send the transaction. Try again.",
        );
      }
      if (!escrow) {
        removePendingTradeSave(account, transactionHash);
        return fail({}, "The transaction confirmed, but no trade was created.");
      }

      // The escrow exists on-chain either way, so a failed save still gives
      // the user its address to add or share.
      const saved = await saveCreatedTrade({ transactionHash, escrow, details: details.data });
      // A failed save stays pending, so it's retried on a later visit.
      if (!saved.ok) {
        return fail({}, `Your trade was created at ${escrow}, but its details couldn't be saved. ${saved.message}`);
      }
      removePendingTradeSave(account, transactionHash);

      // So My trades lists the new trade.
      await queryClient.invalidateQueries({ queryKey: tradesQueryKey });
      router.push(`/trades/${escrow}`);
      return initialState;
    },
    initialState,
  );

  // Submitting through `onSubmit` rather than `action`, because React resets
  // a form after its action runs, which would clear the role pickers: they're
  // controlled, so the reset unchecks them without updating `role`. The form
  // needs a wallet, and so JavaScript, anyway.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const hasError = state.status === "error";
  const values = hasError ? state.values : {};
  const fieldErrors = hasError ? state.fieldErrors : {};

  return (
    <form onSubmit={handleSubmit} noValidate className="panel flex flex-col gap-6 p-6 lg:p-8">
      <Field name="itemName" label="Item name" error={fieldErrors.itemName}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            maxLength={itemDetailsLimits.itemName}
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            defaultValue={values.itemName}
            required
          />
        )}
      </Field>

      <Field
        name="description"
        label="Description"
        error={fieldErrors.description}
      >
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            rows={4}
            spellCheck={false}
            autoCorrect="off"
            maxLength={itemDetailsLimits.description}
            defaultValue={values.description}
          />
        )}
      </Field>

      <RoleField
        name="role"
        legend="Your role"
        value={role}
        onChange={setRole}
        error={fieldErrors.role}
      />

      <MyWalletField account={account} />

      {/* Mirrors "Your role", so only `role` is used: picking the
          counterparty's side picks the opposite one for you. */}
      <RoleField
        name="counterpartyRole"
        legend="Counterparty role"
        value={role && oppositeRole[role]}
        onChange={(counterpartyRole) => setRole(oppositeRole[counterpartyRole])}
      />

      <Field
        name="counterparty"
        label="Counterparty wallet address"
        error={fieldErrors.counterparty}
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            autoComplete="off"
            spellCheck={false}
            defaultValue={values.counterparty}
            required
            className={`${fieldProps.className} font-mono`}
          />
        )}
      </Field>

      <Field
        name="price"
        label={
          <>
            Item price
            <span className="sr-only">{` in ${priceChain.nativeCurrency.symbol}`}</span>
          </>
        }
        error={fieldErrors.price}
      >
        {(fieldProps) => (
          <div className="group flex sm:max-w-48">
            <input
              {...fieldProps}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              defaultValue={values.price}
              required
              className={`${fieldProps.className} min-w-0 rounded-r-none`}
            />
            <TokenSymbol chain={priceChain} />
          </div>
        )}
      </Field>

      {/* Next to the button, where the eye is after submitting. */}
      {hasError && state.message && (
        <p role="alert" className="type-small break-words text-danger">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-lg btn-primary w-full sm:w-auto sm:self-start"
        aria-busy={isPending}
        disabled={isPending}
      >
        {isPending ? "Creating…" : "Create trade"}
      </button>
    </form>
  );
}

/** Ether string to wei, or undefined unless it's a number above 0. */
function parsePrice(value: string) {
  const trimmed = value.trim();
  if (!/^(\d+\.?\d*|\.\d+)$/.test(trimmed)) return undefined;
  try {
    const wei = parseEther(trimmed);
    return wei > BigInt(0) ? wei : undefined;
  } catch {
    return undefined;
  }
}

type SiteChain = (typeof wagmiConfig.chains)[number];

/**
 * The wallet's current network, so the price field follows network switches.
 * Falls back to the factory's network, where trades are created, before a
 * wallet connects.
 */
function getPriceChain(chainId: number | undefined): SiteChain {
  const find = (id: number | undefined) => wagmiConfig.chains.find((chain) => chain.id === id);
  return find(chainId) ?? find(escrowFactoryChain.id) ?? wagmiConfig.chains[0];
}

/**
 * The network's token symbol, e.g. MON, as an add-on box joined to the price
 * field's right side. Its border turns red with the field's on an error.
 */
function TokenSymbol({ chain }: { chain: SiteChain }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center rounded-r-[0.25rem] border border-l-0 border-border bg-border/40 px-3.5 font-semibold text-muted group-has-[[aria-invalid=true]]:border-danger"
    >
      {chain.nativeCurrency.symbol}
    </span>
  );
}

/**
 * The connected wallet, shown greyed out for reference: it becomes the trade's
 * buyer or seller and can't be edited, focused or selected here. Has no
 * `name`, so it isn't submitted.
 */
function MyWalletField({ account }: { account?: Address }) {
  const id = "create-trade-my-wallet";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-small font-semibold">
        My wallet address
      </label>
      <input
        id={id}
        type="text"
        value={account ?? ""}
        placeholder="No wallet connected"
        disabled
        className="field cursor-default font-mono opacity-60 select-none placeholder:font-sans"
      />
    </div>
  );
}

const oppositeRole: Record<Role, Role> = { seller: "buyer", buyer: "seller" };

const roleOptions: { value: Role; label: string }[] = [
  { value: "seller", label: "Seller" },
  { value: "buyer", label: "Buyer" },
];

/** A buyer-or-seller choice as two radio cards side by side. */
function RoleField({
  name,
  legend,
  value,
  onChange,
  error,
}: {
  name: string;
  legend: string;
  value?: Role;
  onChange: (role: Role) => void;
  error?: string;
}) {
  const errorId = `create-trade-${name}-error`;

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="type-small mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-col gap-3 sm:flex-row">
        {roleOptions.map((option) => (
          <label
            key={option.value}
            className="field flex flex-1 cursor-pointer items-center gap-3 text-foreground has-checked:border-accent"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              required
              className="size-4 accent-accent"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="type-small text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

type FieldControlProps = {
  id: string;
  name: FieldName;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

/** Label, control and error message, with the accessibility wiring between them. */
function Field({
  name,
  label,
  error,
  children,
}: {
  name: FieldName;
  label: ReactNode;
  error?: string;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = `create-trade-${name}`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-small font-semibold">
        {label}
      </label>
      {children({
        id,
        name,
        className: "field",
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="type-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
