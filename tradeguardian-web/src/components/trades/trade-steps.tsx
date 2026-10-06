import { formatEther } from "viem";

import { AddressValue } from "@/components/trades/address-value";
import { ChecklistItem } from "@/components/trades/checklist-item";
import { EscrowActionButton } from "@/components/trades/escrow-action-button";
import { TradeProgressStepper } from "@/components/trades/trade-progress-stepper";
import { TradeTimestamp } from "@/components/trades/trade-time";
import { currentUser } from "@/lib/fake-trades";
import { getRequestTime } from "@/lib/request-time";
import {
  canCancel,
  canConfirmReceipt,
  canMarkDelivered,
  canSettle,
  getCanceledBy,
  getCompletedPayout,
  getDeposit,
  getTradeSteps,
  needsDeposit,
  tradeSteps,
  type Trade,
} from "@/lib/trades";

/**
 * The trade's four steps, rendered by MUI's Stepper. The Create Trade step
 * lists the trade's details, the deposits step who has deposited, the
 * delivery step its progress, and the return step the settlement or payout.
 */
export function TradeSteps({ trade }: { trade: Trade }) {
  const statuses = getTradeSteps(trade);

  return (
    <TradeProgressStepper
      steps={tradeSteps.map((step, index) => ({
        label: step.label,
        status: statuses[index],
        content:
          index === 0 ? (
            <CreationDetails trade={trade} />
          ) : step.states.includes("AWAITING_DEPOSIT") ? (
            <DepositDetails trade={trade} />
          ) : step.states.includes("AWAITING_DELIVERY") ? (
            getDeliveryContent(trade)
          ) : (
            getReturnContent(trade)
          ),
      }))}
    />
  );
}

/**
 * Under the Create Trade step, from what people look for most to what they
 * check least: the item (name, price, description), who's involved (the
 * user's role, then their wallet and the other party's), then the on-chain
 * record (when it was created, the escrow, and the transaction that created
 * it). Labels sit above their values on phones; from `sm` up, each pair
 * shares a row of a two-column grid, so both values start at the same edge.
 */
/** For an optional detail the trade's creator left blank. */
function NotGiven() {
  return <span className="text-muted">None</span>;
}

function CreationDetails({ trade }: { trade: Trade }) {
  const isSeller = trade.seller === currentUser;
  const seller = { side: "Seller", address: trade.seller };
  const buyer = { side: "Buyer", address: trade.buyer };
  // The user's own side first, right under their role.
  const parties = isSeller ? [seller, buyer] : [buyer, seller];

  return (
    // minmax(0, …) columns can't grow past the step, so long values like the
    // single-line transaction ID shorten or wrap instead of overflowing it.
    <dl className="type-small grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
      <div className="sm:contents">
        <dt className="text-muted">Item name</dt>
        <dd className="min-w-0 break-words">{trade.itemName || <NotGiven />}</dd>
      </div>
      <div className="sm:contents">
        <dt className="text-muted">Item price</dt>
        <dd>{formatEther(trade.itemPrice)} MON</dd>
      </div>
      <div className="sm:contents">
        <dt className="text-muted">Description</dt>
        {/* Free text from the trade's creator; keep its line breaks. */}
        <dd className="min-w-0 break-words whitespace-pre-line text-pretty">
          {trade.description || <NotGiven />}
        </dd>
      </div>
      <div className="sm:contents">
        <dt className="text-muted sm:self-center">Your role</dt>
        <dd>{isSeller ? "Seller" : "Buyer"}</dd>
      </div>
      {parties.map(({ side, address }) => (
        <div key={side} className="sm:contents">
          <dt className="text-muted sm:self-center">{side}</dt>
          <dd className="min-w-0">
            <AddressValue
              address={address}
              copyLabel={
                address === currentUser
                  ? undefined
                  : `Copy ${side.toLowerCase()} address`
              }
            />
          </dd>
        </div>
      ))}
      <div className="sm:contents">
        <dt className="text-muted sm:self-center">Created</dt>
        <dd>
          <TradeTimestamp
            dateTime={trade.createdAt.toISOString()}
            serverNow={getRequestTime()}
            hasClockIcon={false}
          />
        </dd>
      </div>
      <div className="sm:contents">
        <dt className="text-muted sm:self-center">Contract Address</dt>
        <dd className="min-w-0">
          <AddressValue
            address={trade.escrow}
            copyLabel="Copy contract address"
          />
        </dd>
      </div>
      <div className="sm:contents">
        <dt className="text-muted sm:self-center">Transaction ID</dt>
        <dd className="min-w-0">
          <AddressValue
            address={trade.transactionHash}
            copyLabel="Copy transaction ID"
            isSingleLine
          />
        </dd>
      </div>
    </dl>
  );
}

/**
 * Under the deposits step, at every status: whether each side has deposited,
 * and how much, and on a canceled trade, which side canceled it. While the
 * trade awaits deposits it also has the deposit button on your turn, or the
 * cancel button once the deposit window has closed.
 */
function DepositDetails({ trade }: { trade: Trade }) {
  const isSeller = trade.seller === currentUser;
  const deposit = getDeposit(trade, isSeller);
  const canceledBy = getCanceledBy(trade);

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Deposits" className="flex flex-col gap-1.5">
        <ChecklistItem isDone={trade.hasSellerDeposited}>
          {trade.hasSellerDeposited
            ? `Seller has deposited ${formatEther(getDeposit(trade, true))} MON`
            : "Seller has not deposited funds"}
        </ChecklistItem>
        <ChecklistItem isDone={trade.hasBuyerDeposited}>
          {trade.hasBuyerDeposited
            ? `Buyer has deposited ${formatEther(getDeposit(trade, false))} MON`
            : "Buyer has not deposited funds"}
        </ChecklistItem>
        {canceledBy && (
          <ChecklistItem isDone={false} isFailed>
            {canceledBy} has canceled the trade.
          </ChecklistItem>
        )}
      </ul>
      {needsDeposit(trade, isSeller) && (
        <EscrowActionButton
          escrow={trade.escrow}
          account={currentUser}
          functionName={isSeller ? "sellerDeposit" : "buyerDeposit"}
          value={deposit}
          verb="deposit"
          label="Deposit"
          pendingLabel="Depositing…"
          successMessage="Deposit confirmed."
          align="start"
        />
      )}
      {canCancel(trade, isSeller, getRequestTime()) && (
        <EscrowActionButton
          escrow={trade.escrow}
          account={currentUser}
          functionName="withdraw"
          verb="cancel the trade"
          label="Cancel trade"
          pendingLabel="Canceling…"
          successMessage="Trade canceled. Your deposit was returned."
          variant="destructive"
          align="start"
        />
      )}
    </div>
  );
}

/**
 * Under the delivery step, at every status from delivery on. While awaiting
 * delivery, after it, and once completed: whether the seller has marked the
 * item delivered and whether the buyer has confirmed it, with the Item
 * delivered button for the seller, then the Item Received and Not Received
 * buttons for the buyer. After an incorrect-item report, and once settled,
 * the buyer's line shows the report (its settlement is under the return
 * step). Other statuses get no content.
 */
function getDeliveryContent(trade: Trade) {
  if (
    trade.state === "AWAITING_DELIVERY" ||
    trade.state === "ITEM_SENT" ||
    trade.state === "ITEM_RECEIVED" ||
    trade.state === "ITEM_INCORRECT" ||
    trade.state === "SETTLED"
  ) {
    const hasSellerDelivered = trade.state !== "AWAITING_DELIVERY";
    const hasBuyerReceived = trade.state === "ITEM_RECEIVED";
    // Settled trades only come from an incorrect-item report.
    const hasBuyerReportedNotReceived =
      trade.state === "ITEM_INCORRECT" || trade.state === "SETTLED";

    return (
      <div className="flex flex-col gap-4">
        <ul aria-label="Delivery" className="flex flex-col gap-1.5">
          <ChecklistItem isDone={hasSellerDelivered}>
            {hasSellerDelivered
              ? "Seller has marked item as delivered"
              : "Seller has not marked item as delivered"}
          </ChecklistItem>
          <ChecklistItem
            isDone={hasBuyerReceived}
            isFailed={hasBuyerReportedNotReceived}
          >
            {hasBuyerReceived
              ? "Buyer has marked item as received"
              : hasBuyerReportedNotReceived
                ? "Buyer has marked item as not received"
                : "Buyer has not updated received status"}
          </ChecklistItem>
        </ul>
        {canMarkDelivered(trade, trade.seller === currentUser) && (
          <EscrowActionButton
            escrow={trade.escrow}
            account={currentUser}
            functionName="setSellerHasGivenItem"
            verb="mark the item delivered"
            label="Item delivered"
            pendingLabel="Marking as delivered…"
            successMessage="Marked as delivered. Waiting for the buyer to confirm."
            variant="success"
            align="start"
          />
        )}
        {canConfirmReceipt(trade, trade.seller === currentUser) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <EscrowActionButton
              escrow={trade.escrow}
              account={currentUser}
              functionName="setBuyerHasReceivedCorrectItem"
              verb="confirm you received the item"
              label="Item Received"
              pendingLabel="Confirming…"
              successMessage="Receipt confirmed. The escrow paid out to both sides."
              variant="success"
              align="start"
            />
            <EscrowActionButton
              escrow={trade.escrow}
              account={currentUser}
              functionName="setBuyerHasReceivedIncorrectItem"
              verb="report the item as not received"
              label="Not Received"
              pendingLabel="Reporting…"
              successMessage="Reported. Both sides now need to settle to release the remaining deposits."
              variant="destructive"
              align="start"
              confirmation={getNotReceivedConfirmation(trade)}
            />
          </div>
        )}
      </div>
    );
  }

  return undefined;
}

/**
 * Under the return step after an incorrect-item report: whether each side has
 * settled, since the deposits are returned once both have, with the Settle
 * button until your side has. Once settled, both sides have. Once completed,
 * where the escrow's funds went. Other statuses get no content.
 */
function getReturnContent(trade: Trade) {
  if (trade.state === "ITEM_RECEIVED") return <CompletedPayout trade={trade} />;
  if (trade.state !== "ITEM_INCORRECT" && trade.state !== "SETTLED")
    return undefined;

  // The escrow only reaches SETTLED once both sides have settled.
  const isSettled = trade.state === "SETTLED";
  const hasSellerSettled = isSettled || trade.hasSellerSettled;
  const hasBuyerSettled = isSettled || trade.hasBuyerSettled;

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Settlement" className="flex flex-col gap-1.5">
        <ChecklistItem isDone={hasSellerSettled}>
          {hasSellerSettled
            ? "Seller has requested to settle"
            : "Seller has not requested to settle"}
        </ChecklistItem>
        <ChecklistItem isDone={hasBuyerSettled}>
          {hasBuyerSettled
            ? "Buyer has requested to settle"
            : "Buyer has not requested to settle"}
        </ChecklistItem>
      </ul>
      {canSettle(trade, trade.seller === currentUser) && (
        <EscrowActionButton
          escrow={trade.escrow}
          account={currentUser}
          functionName="settle"
          verb="settle"
          label="Settle"
          pendingLabel="Settling…"
          successMessage="Settlement confirmed. The deposits are returned once both sides settle."
          align="start"
        />
      )}
    </div>
  );
}

/**
 * Where the escrow's funds went once the buyer confirmed the item: the price
 * paid to the seller, then each side's deposit back, net of its half of the
 * fee.
 */
function CompletedPayout({ trade }: { trade: Trade }) {
  const payout = getCompletedPayout(trade);

  return (
    <ul aria-label="Payout" className="flex flex-col gap-1.5">
      <ChecklistItem isDone>
        Buyer paid {formatEther(payout.paidToSeller)} MON to seller
      </ChecklistItem>
      <ChecklistItem isDone>
        {formatEther(payout.returnedToSeller)} MON returned to seller
      </ChecklistItem>
      <ChecklistItem isDone>
        {formatEther(payout.returnedToBuyer)} MON returned to buyer
      </ChecklistItem>
    </ul>
  );
}

/** Mirrors `PERCENTAGE_RETURNED_TO_BUYER` in `Escrow`. */
const percentageReturnedToBuyer = BigInt(25);

/**
 * Explains, with the amounts, what reporting the item as not received does:
 * the escrow returns a quarter of the buyer's deposit and locks the rest, with
 * the seller's deposit, until both sides settle.
 */
function getNotReceivedConfirmation(trade: Trade) {
  const buyerDeposit = getDeposit(trade, false);
  const returned = (buyerDeposit * percentageReturnedToBuyer) / BigInt(100);
  const locked = buyerDeposit - returned;

  return {
    title: "Report item as not received?",
    message: `You'll get ${formatEther(returned)} MON (25% of your deposit) back now. The other ${formatEther(locked)} MON, and the seller's ${formatEther(getDeposit(trade, true))} MON deposit, stay locked in escrow until you and the seller both settle. This can't be undone.`,
    confirmLabel: "Yes, report not received",
  };
}
