"use server";

import { revalidatePath } from "next/cache";
import {
  createPublicClient,
  http,
  isAddress,
  isAddressEqual,
  isHash,
  parseEventLogs,
  type Address,
  type Hash,
} from "viem";

import { escrowFactoryAbi, escrowFactoryAddress, escrowFactoryChain } from "@/lib/escrow-factory";
import { addTrade } from "@/lib/fake-trades";

import { type ItemDetails, itemDetailsSchema } from "./create-trade";

const publicClient = createPublicClient({ chain: escrowFactoryChain, transport: http() });

/**
 * Saves a trade the browser just created through the factory. Only the item
 * name and description are taken from the client; the escrow, addresses,
 * price and date are read from the transaction's `EscrowCreated` event, so a
 * trade can only be saved for an escrow the factory really created.
 */
export async function saveCreatedTrade(input: {
  transactionHash: Hash;
  escrow: Address;
  details: ItemDetails;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const details = itemDetailsSchema.safeParse(input.details);
  const factory = escrowFactoryAddress;
  if (!details.success || !isHash(input.transactionHash) || !isAddress(input.escrow) || !factory) {
    return { ok: false, message: "The trade's details were invalid." };
  }

  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: input.transactionHash });
  } catch {
    return { ok: false, message: `Couldn't find the transaction on ${escrowFactoryChain.name}.` };
  }

  const [created] = parseEventLogs({
    abi: escrowFactoryAbi,
    eventName: "EscrowCreated",
    logs: receipt.logs.filter((log) => isAddressEqual(log.address, factory)),
  });
  if (receipt.status !== "success" || !created || !isAddressEqual(created.args.escrow, input.escrow)) {
    return { ok: false, message: "That transaction didn't create this trade." };
  }

  const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
  addTrade({
    escrow: created.args.escrow,
    transactionHash: input.transactionHash,
    itemName: details.data.itemName,
    description: details.data.description,
    seller: created.args.seller,
    buyer: created.args.buyer,
    itemPrice: created.args.itemPrice,
    state: "AWAITING_DEPOSIT",
    hasSellerDeposited: false,
    hasBuyerDeposited: false,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date(Number(block.timestamp) * 1000),
  });
  revalidatePath("/trades");
  return { ok: true };
}
