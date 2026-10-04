/**
 * The parts of `Escrow` in tradeguardian-contracts that the web app reads.
 * Add entries here as more of the contract is used.
 */
export const escrowAbi = [
  {
    type: "function",
    name: "seller",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "buyer",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;
