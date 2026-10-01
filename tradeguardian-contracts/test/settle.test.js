const { expect } = require("chai");
const {
    loadFixture,
    deployEscrow,
    BUYER_DEPOSIT_MULTIPLIER,
    PERCENTAGE_RETURNED_TO_BUYER,
    EscrowStates
} = require("./utils");

async function deployEscrowInItemIncorrectState() {
    const fixture = await deployEscrow();
    const { escrow, buyer, seller, itemPrice } = fixture;

    await escrow.connect(buyer).buyerDeposit({ value: itemPrice * BUYER_DEPOSIT_MULTIPLIER });
    await escrow.connect(seller).sellerDeposit({ value: itemPrice });
    await escrow.connect(seller).setSellerHasGivenItem();
    await escrow.connect(buyer).setBuyerHasReceivedIncorrectItem();

    return fixture;
}

function expectedBuyerSettlementAmount(itemPrice) {
    const buyerDeposit = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
    return buyerDeposit - (buyerDeposit * PERCENTAGE_RETURNED_TO_BUYER) / 100n;
}

describe("Settle", function () {
    it("Should revert if called by a non-party", async function () {
        const { escrow, thirdParty } = await loadFixture(deployEscrowInItemIncorrectState);

        await expect(escrow.connect(thirdParty).settle())
            .to.be.revertedWith("You are not the buyer or seller.");
    });

    it("Should revert if the state is not ITEM_INCORRECT", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);

        await expect(escrow.connect(buyer).settle())
            .to.be.revertedWith("Invalid state for settlement");

        await escrow.connect(buyer).buyerDeposit({ value: itemPrice * BUYER_DEPOSIT_MULTIPLIER });
        await escrow.connect(seller).sellerDeposit({ value: itemPrice });
        await escrow.connect(seller).setSellerHasGivenItem();

        await expect(escrow.connect(seller).settle())
            .to.be.revertedWith("Invalid state for settlement");
    });

    it("Should not pay out or change state when only the buyer has settled", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrowInItemIncorrectState);

        const tx = escrow.connect(buyer).settle();

        await expect(tx).to.not.emit(escrow, "Settled");
        await expect(tx).to.changeEtherBalances([escrow, buyer, seller], [0, 0, 0]);
        expect(await escrow.currentState()).to.equal(EscrowStates.ITEM_INCORRECT);
        expect(await escrow.userBalances(seller.address)).to.equal(itemPrice);
        expect(await escrow.userBalances(buyer.address)).to.equal(expectedBuyerSettlementAmount(itemPrice));
    });

    it("Should not pay out or change state when only the seller has settled", async function () {
        const { escrow, buyer, seller } = await loadFixture(deployEscrowInItemIncorrectState);

        const tx = escrow.connect(seller).settle();

        await expect(tx).to.not.emit(escrow, "Settled");
        await expect(tx).to.changeEtherBalances([escrow, buyer, seller], [0, 0, 0]);
        expect(await escrow.currentState()).to.equal(EscrowStates.ITEM_INCORRECT);
    });

    it("Should revert if the buyer settles twice", async function () {
        const { escrow, buyer } = await loadFixture(deployEscrowInItemIncorrectState);

        await escrow.connect(buyer).settle();

        await expect(escrow.connect(buyer).settle())
            .to.be.revertedWith("The buyer has already settled.");
    });

    it("Should revert if the seller settles twice", async function () {
        const { escrow, seller } = await loadFixture(deployEscrowInItemIncorrectState);

        await escrow.connect(seller).settle();

        await expect(escrow.connect(seller).settle())
            .to.be.revertedWith("The seller has already settled.");
    });

    it("Should pay out both parties and set state to SETTLED once both settle (buyer first)", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrowInItemIncorrectState);
        const buyerAmount = expectedBuyerSettlementAmount(itemPrice);

        await escrow.connect(buyer).settle();

        await expect(escrow.connect(seller).settle()).to.changeEtherBalances(
            [escrow, buyer, seller],
            [-(buyerAmount + itemPrice), buyerAmount, itemPrice]
        );
        expect(await escrow.currentState()).to.equal(EscrowStates.SETTLED);
        expect(await escrow.userBalances(buyer.address)).to.equal(0);
        expect(await escrow.userBalances(seller.address)).to.equal(0);
        expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0);
    });

    it("Should pay out both parties and set state to SETTLED once both settle (seller first)", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrowInItemIncorrectState);
        const buyerAmount = expectedBuyerSettlementAmount(itemPrice);

        await escrow.connect(seller).settle();

        await expect(escrow.connect(buyer).settle()).to.changeEtherBalances(
            [escrow, buyer, seller],
            [-(buyerAmount + itemPrice), buyerAmount, itemPrice]
        );
        expect(await escrow.currentState()).to.equal(EscrowStates.SETTLED);
    });

    it("Should return the buyer's full deposit across the incorrect-item refund and settlement", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDeposit = itemPrice * BUYER_DEPOSIT_MULTIPLIER;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDeposit });
        await escrow.connect(seller).sellerDeposit({ value: itemPrice });
        await escrow.connect(seller).setSellerHasGivenItem();

        const refundTx = escrow.connect(buyer).setBuyerHasReceivedIncorrectItem();
        const refund = (buyerDeposit * PERCENTAGE_RETURNED_TO_BUYER) / 100n;
        await expect(refundTx).to.changeEtherBalance(buyer, refund);

        await escrow.connect(seller).settle();
        await expect(escrow.connect(buyer).settle())
            .to.changeEtherBalance(buyer, buyerDeposit - refund);
    });

    it("Should emit Settled event with correct parameters", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrowInItemIncorrectState);

        await escrow.connect(buyer).settle();

        await expect(escrow.connect(seller).settle())
            .to.emit(escrow, "Settled")
            .withArgs(buyer.address, seller.address, expectedBuyerSettlementAmount(itemPrice), itemPrice);
    });

    it("Should revert if either party calls settle after the trade is SETTLED", async function () {
        const { escrow, buyer, seller } = await loadFixture(deployEscrowInItemIncorrectState);

        await escrow.connect(buyer).settle();
        await escrow.connect(seller).settle();

        await expect(escrow.connect(buyer).settle())
            .to.be.revertedWith("Invalid state for settlement");
        await expect(escrow.connect(seller).settle())
            .to.be.revertedWith("Invalid state for settlement");
    });
});
