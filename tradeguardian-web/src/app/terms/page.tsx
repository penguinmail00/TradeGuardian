import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | TradeGuardian",
  description:
    "The terms for using TradeGuardian's escrow for trades between buyers and sellers on Monad.",
};

// Describes the escrow as Escrow.sol and EscrowFactory.sol implement it; keep
// in step with the contracts and the FAQ.
const sections: LegalSection[] = [
  {
    heading: "What TradeGuardian is",
    paragraphs: [
      "TradeGuardian is a website for creating and managing escrow trades between a buyer and a seller. Each trade is its own smart contract on the Monad blockchain, created by TradeGuardian's escrow factory contract.",
      "TradeGuardian is non-custodial. Funds in a trade are held by its smart contract, not by us, and only the contract's rules decide when they move. We have no way to move, freeze, or reverse funds in a trade.",
    ],
  },
  {
    heading: "Your wallet and your responsibilities",
    paragraphs: [
      "You need a compatible crypto wallet to use TradeGuardian. You are responsible for your wallet, its keys and recovery phrase, and every transaction you approve with it. We never ask for your keys or recovery phrase, and cannot recover a lost wallet.",
      "You are responsible for making sure that using TradeGuardian, and the trades you make, are legal where you live, and for any taxes that apply to them.",
    ],
  },
  {
    heading: "How trades work",
    paragraphs: [
      "Either side can create a trade. The seller deposits the item price and the buyer deposits twice the item price. If the other side hasn't deposited within 2 hours of the trade being created, you can cancel it and withdraw your deposit.",
      "Once both deposits are in, the seller hands over the item and marks it as delivered. When the buyer confirms they received the agreed item, the contract pays the seller the item price plus their deposit and returns the rest of the buyer's deposit, less the fee below.",
      "If the buyer reports that they received the wrong item, both deposits stay locked in the contract until both the buyer and the seller settle. Once both have settled, each gets their own deposit back in full.",
    ],
  },
  {
    heading: "Fees",
    paragraphs: [
      "When a trade completes, the contract charges a fee of 1% of the item price, split evenly between buyer and seller (0.5% each) and sent to TradeGuardian. No fee is charged on cancelled or settled trades.",
      "Every transaction also costs a network (gas) fee, paid to the Monad network rather than to TradeGuardian.",
    ],
  },
  {
    heading: "What we don't do",
    paragraphs: [
      "We don't check items, verify who buyers and sellers are, or judge disputes. Whether the right item was delivered is decided by the buyer's confirmation, as set out above.",
      "Blockchain transactions are final. Once you approve a transaction, we cannot cancel, change, or undo it.",
    ],
  },
  {
    heading: "Prohibited use",
    paragraphs: [
      "Don't use TradeGuardian to trade anything illegal, to commit fraud, to launder money, or to break any law or anyone else's rights. Don't attack, overload, or try to interfere with the website or its services.",
    ],
  },
  {
    heading: "Risks",
    paragraphs: [
      "Crypto and smart contracts carry risk, including bugs, network outages, wallet compromise, and changes in the value of the currency you trade in. Only trade amounts you can afford to lose.",
      "TradeGuardian is provided as is, without warranties of any kind. To the extent the law allows, we are not liable for losses from using it, including losses from trades, transactions, or the blockchain itself.",
    ],
  },
  {
    heading: "Changes to these terms",
    paragraphs: [
      "We may update these terms. When we do, we'll change the date at the top of this page. Using TradeGuardian after an update means you accept the new terms.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about these terms? Reach us through the Support page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="October 11, 2026"
      intro="These terms apply when you use the TradeGuardian website and its escrow contracts. Please read them before you trade."
      sections={sections}
    />
  );
}
