import { getAddress, isAddress, type Address } from "viem";
import { monadTestnet } from "wagmi/chains";

/** The parts of `EscrowFactory` in tradeguardian-contracts that the site uses. */
export const escrowFactoryAbi = [
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "nonpayable",
    inputs: [
      { name: "seller", type: "address" },
      { name: "buyer", type: "address" },
      { name: "itemPrice", type: "uint256" },
    ],
    outputs: [{ name: "escrow", type: "address" }],
  },
  {
    type: "event",
    name: "EscrowCreated",
    inputs: [
      { name: "escrow", type: "address", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "itemPrice", type: "uint256", indexed: false },
    ],
  },
] as const;

/** The factory is only deployed on Monad Testnet so far. */
export const escrowFactoryChain = monadTestnet;

const configuredAddress = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS;

/**
 * From `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS`. Undefined when it isn't set, so
 * only creating a trade fails, not the whole site.
 */
export const escrowFactoryAddress: Address | undefined =
  configuredAddress && isAddress(configuredAddress)
    ? getAddress(configuredAddress)
    : undefined;
