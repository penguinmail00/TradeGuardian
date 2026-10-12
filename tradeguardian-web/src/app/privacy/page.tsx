import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | TradeGuardian",
  description:
    "What information TradeGuardian collects, how it's used, and what's public on the blockchain.",
};

// Lists what the app actually sends or stores (trades-api.ts, support-api.ts,
// the wagmi.store cookie); keep in step when that changes.
const sections: LegalSection[] = [
  {
    heading: "What we collect",
    paragraphs: [
      "Your wallet address, when you connect your wallet and use TradeGuardian.",
      "Trade records: when you create or add a trade, we save its escrow contract address, the buyer's and seller's wallet addresses, and the name and description you give it, so your trades can be listed and searched. We also save whether you've archived a trade, along with the wallet signature that approved it.",
      "Support requests: the email address, subject, and description you send through the Support page.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "We use one cookie, which remembers whether your wallet is connected so you stay connected between pages and visits. We don't use advertising or analytics cookies, and we don't track you across other websites.",
    ],
  },
  {
    heading: "The blockchain is public",
    paragraphs: [
      "Trades happen on the Monad blockchain. Every deposit, confirmation, and payout, along with the wallet addresses and amounts involved, is public and permanent, and anyone can see it on a block explorer such as Monadscan. We can't hide or delete anything recorded on the blockchain.",
    ],
  },
  {
    heading: "How we use your information",
    paragraphs: [
      "To show you your trades, keep your archive in sync across devices, and answer your support requests. We don't sell your information or share it for advertising.",
    ],
  },
  {
    heading: "Services we rely on",
    paragraphs: [
      "Connecting a wallet goes through your wallet provider and, for some wallets, WalletConnect. Reading the blockchain goes through Monad network providers. These services handle your wallet address and requests under their own privacy policies. Our website and backend run on hosting providers that process requests on our behalf.",
    ],
  },
  {
    heading: "Your choices",
    paragraphs: [
      "You can disconnect your wallet at any time. To ask us to delete the trade records or support requests we hold about you, contact us through the Support page. Information on the blockchain can't be deleted by anyone.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "We may update this policy. When we do, we'll change the date at the top of this page.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about your privacy? Reach us through the Support page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="October 11, 2026"
      intro="This policy explains what information TradeGuardian collects when you use it, how we use it, and what's public on the blockchain."
      sections={sections}
    />
  );
}
