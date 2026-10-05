import { isAddress, isAddressEqual, parseEther, type Address } from "viem";

import type { Trade } from "@/lib/trades";

// Placeholder data until trades are read from the factory's EscrowCreated logs
// for the connected wallet.
export const currentUser: Address = "0x98ccB132FfeAf4E8C6D328211BAD57413AbaB84A";

export const trades: Trade[] = [
  {
    escrow: "0x64a996E6bA4326F849419625eeB49FF696De242B",
    transactionHash: "0x6d41f1768455f549a58eca2e07889ff4ef75ee30bdf8c011f543578db7c874e3",
    itemName: "Road bike (54cm frame)",
    description:
      "Carbon frame with a full 11-speed groupset. New tires and chain this summer; collection only.",
    seller: "0x6297CBDA4aC80584C02CACC31669Ae8f844Aa8EA",
    buyer: currentUser,
    itemPrice: parseEther("0.8"),
    state: "AWAITING_DEPOSIT",
    hasSellerDeposited: false,
    hasBuyerDeposited: false,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date("2026-10-04T03:10:00Z"),
  },
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
    hasSellerDeposited: true,
    hasBuyerDeposited: false,
    hasSellerSettled: false,
    hasBuyerSettled: false,
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
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: false,
    hasBuyerSettled: false,
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
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date("2026-09-28T15:40:00Z"),
  },
  {
    escrow: "0x4c5859f0F772848b2D91F1D83E2Fe57935348029",
    transactionHash: "0x9e72392b7892101710d5e64aac14f8a4cefb0be53bb13c142a7ab85113b8a9f2",
    itemName: "Swiss automatic dive watch",
    description:
      "Unworn, full set with box and papers dated 2024. Black dial, 41mm steel case.",
    seller: currentUser,
    buyer: "0x617F2E2fD72FD9D5503197092aC168c91465E7f2",
    itemPrice: parseEther("3"),
    state: "ITEM_INCORRECT",
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: true,
    hasBuyerSettled: false,
    createdAt: new Date("2026-09-21T11:05:00Z"),
  },
  {
    escrow: "0x193558FC6e91e5F72C98A8A7A59CB0829984f614",
    transactionHash: "0x1df0fa31054d16087aa355b042529572f670b29d3e9741a56e286661ac3cd884",
    itemName: "Noise-cancelling headphones",
    description:
      "Over-ear, black. Barely used, with the carrying case and charging cable.",
    seller: currentUser,
    buyer: "0x28438014db95BdB8254bB3F5ffE9B888b5D5c9b5",
    itemPrice: parseEther("0.35"),
    state: "ITEM_INCORRECT",
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: false,
    hasBuyerSettled: true,
    createdAt: new Date("2026-09-18T16:20:00Z"),
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
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date("2026-09-14T20:30:00Z"),
  },
  {
    escrow: "0xC1794fd214C774f648C24619b2D4937Af09793B4",
    transactionHash: "0x499b739b7aa7fa971afd6d62da30fa69ac53eb062c2ca83708f661f2e4d414e1",
    itemName: "Leather messenger bag",
    description:
      "Full-grain brown leather with brass buckles. Fits a 15-inch laptop.",
    seller: "0x612C911a896D0E6Fb60D70b32d195647d0Ed3e89",
    buyer: currentUser,
    itemPrice: parseEther("0.4"),
    state: "SETTLED",
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: true,
    hasBuyerSettled: true,
    createdAt: new Date("2026-09-11T10:45:00Z"),
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
    hasSellerDeposited: true,
    hasBuyerDeposited: true,
    hasSellerSettled: false,
    hasBuyerSettled: false,
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
    hasSellerDeposited: false,
    hasBuyerDeposited: true,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date("2026-09-03T08:15:00Z"),
  },
  {
    escrow: "0x36D2Af5eD051F4b3AAb650c5B0B2f33966571d10",
    transactionHash: "0xa1ed03f6d27bcc9bd779ce1d8092533a4c5f508c9ca62acfd39bb7c4447e8586",
    itemName: "Retro arcade stick",
    description:
      "Full-size stick with Sanwa buttons and a USB-C cable. A few scuffs on the base plate.",
    // The other party, the seller, deposited and then canceled.
    seller: "0x5F4d6CC8c6b6271176b8BE5005f85488A54CDc57",
    buyer: currentUser,
    itemPrice: parseEther("0.45"),
    state: "TRADE_CANCELED",
    hasSellerDeposited: true,
    hasBuyerDeposited: false,
    hasSellerSettled: false,
    hasBuyerSettled: false,
    createdAt: new Date("2026-08-28T19:40:00Z"),
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
