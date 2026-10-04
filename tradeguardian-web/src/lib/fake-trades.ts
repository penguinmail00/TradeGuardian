import { isAddress, isAddressEqual, parseEther, type Address } from "viem";

import type { Trade } from "@/lib/trades";

// Placeholder data until trades are read from the factory's EscrowCreated logs
// for the connected wallet.
export const currentUser: Address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";

export const trades: Trade[] = [
  {
    escrow: "0x9d4454B023096f34B160D6B654540c56A1F81688",
    transactionHash: "0xc6abd3dcacfe9ed9173636b67c6edc8b06fe49cb1f24c00284cc5ad58bf82c28",
    itemName: "Vintage instant camera",
    description:
      "Fully working and recently serviced. Comes with the original leather case and one unopened pack of film.",
    seller: currentUser,
    buyer: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
    itemPrice: parseEther("0.25"),
    state: "AWAITING_DEPOSIT",
    createdAt: new Date("2026-10-02T18:24:00Z"),
  },
  {
    escrow: "0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00",
    transactionHash: "0xfd5fee27fa43faa9920be13a8c1a8b3bc2155acbb43dc847ac659818fce825c3",
    itemName: "Handheld game console (OLED)",
    description:
      "White model, lightly used. Includes the dock, both controllers, charger and original box.",
    seller: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    buyer: currentUser,
    itemPrice: parseEther("1.2"),
    state: "ITEM_SENT",
    createdAt: new Date("2026-09-30T09:12:00Z"),
  },
  {
    escrow: "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570",
    transactionHash: "0xd895930dece5deac300934b80a076e0a4db0efed6b20be007bfcbb1f6bfa170f",
    itemName: "Signed first-edition paperback",
    description:
      "Signed by the author on the title page. Minor shelf wear on the spine, pages are clean.",
    seller: currentUser,
    buyer: "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB",
    itemPrice: parseEther("0.075"),
    state: "AWAITING_DELIVERY",
    createdAt: new Date("2026-09-28T15:40:00Z"),
  },
  {
    escrow: "0x4c5859f0F772848b2D91F1D83E2Fe57935348029",
    transactionHash: "0x9e72392b7892101710d5e64aac14f8a4cefb0be53bb13c142a7ab85113b8a9f2",
    itemName: "Swiss automatic dive watch",
    description:
      "Unworn, full set with box and papers dated 2024. Black dial, 41mm steel case.",
    seller: "0x617F2E2fD72FD9D5503197092aC168c91465E7f2",
    buyer: currentUser,
    itemPrice: parseEther("3"),
    state: "ITEM_INCORRECT",
    createdAt: new Date("2026-09-21T11:05:00Z"),
  },
  {
    escrow: "0x1291Be112d480055DaFd8a610b7d1e203891C274",
    transactionHash: "0x6bcfc4cb340bbd23b1dd9b8767f5b613efefd03e9b80a04765d9a0a89cc264b4",
    itemName: "Mechanical keyboard",
    description:
      "75% layout with brown switches and an aluminium case. Includes a spare keycap set.",
    seller: currentUser,
    buyer: "0x17F6AD8Ef982297579C203069C1DbfFE4348c372",
    itemPrice: parseEther("0.5"),
    state: "ITEM_RECEIVED",
    createdAt: new Date("2026-09-14T20:30:00Z"),
  },
  {
    escrow: "0x1D82D6CF2c18903444C6599245a4074D7505C10A",
    transactionHash: "0x37c8dc5b12c62c27dc4756f536b000ba6837c49a3d2b9367165c57fe88de6947",
    itemName: "Mirrorless camera lens",
    description:
      "35mm f/1.8 prime with front and rear caps and the original hood. No scratches on the glass.",
    seller: "0xd8b0C23d94E99994f37B5E565715dC17D654ac87",
    buyer: currentUser,
    itemPrice: parseEther("0.6"),
    state: "SETTLED",
    createdAt: new Date("2026-09-08T13:50:00Z"),
  },
  {
    escrow: "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154",
    transactionHash: "0x59e4331bf65b0ec020079f5e7e0fc74fe30688e5b94703d83fd1a705cf141203",
    itemName: "Concert tickets (×2)",
    description:
      "Two floor tickets for the Saturday show, transferred through the official ticketing app.",
    seller: "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
    buyer: currentUser,
    itemPrice: parseEther("0.9"),
    state: "TRADE_CANCELED",
    createdAt: new Date("2026-09-03T08:15:00Z"),
  },
];

// Archiving is per user and off-chain. Until there is a database this lives in
// server memory, so it resets whenever the server restarts.
const archivedEscrows = new Set<Address>([
  "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154",
]);

export function isArchived(trade: Trade) {
  return archivedEscrows.has(trade.escrow);
}

export function setArchived(trade: Trade, archived: boolean) {
  if (archived) archivedEscrows.add(trade.escrow);
  else archivedEscrows.delete(trade.escrow);
}

/** Looks up a trade by escrow address, ignoring checksum casing. */
export function findTrade(escrow: string) {
  if (!isAddress(escrow)) return undefined;
  return trades.find((trade) => isAddressEqual(trade.escrow, escrow));
}
