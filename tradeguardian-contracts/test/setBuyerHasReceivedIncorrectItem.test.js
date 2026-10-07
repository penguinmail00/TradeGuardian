const { expect } = require("chai");
const { 
    loadFixture,
    deployEscrow, 
    BUYER_DEPOSIT_MULTIPLIER,
    EscrowStates
} = require("./utils");

describe("Set buyer has received incorrect item", function () {

    it("Should revert if called by non-buyer", async function () {
        const { escrow, seller } = await loadFixture(deployEscrow);

        await expect(escrow.connect(seller).setBuyerHasReceivedIncorrectItem())
            .to.be.revertedWith("Only buyer can execute this");
    });

    it("Should revert if current state is not ITEM_SENT", async function () {
        const { escrow, buyer } = await loadFixture(deployEscrow);

        // Assuming initial state is AWAITING_DEPOSIT
        await expect(escrow.connect(buyer).setBuyerHasReceivedIncorrectItem())
            .to.be.revertedWith("Invalid state for this action");
    });

    it("Should update the state to ITEM_INCORRECT", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });
        await escrow.connect(seller).setSellerHasGivenItem();
        await escrow.connect(buyer).setBuyerHasReceivedIncorrectItem();

        const currentState = await escrow.currentState();
        expect(currentState).to.equal(EscrowStates.ITEM_INCORRECT);
    });

    it("Should keep the buyer's full deposit in escrow", async function() {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;
    
        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });
        await escrow.connect(seller).setSellerHasGivenItem();
    
        const tx = escrow.connect(buyer).setBuyerHasReceivedIncorrectItem();

        await expect(tx).to.changeEtherBalances([escrow, buyer], [0, 0]);
        expect(await escrow.userBalances(buyer.address)).to.equal(buyerDepositAmount);
        expect(await escrow.userBalances(seller.address)).to.equal(sellerDepositAmount);
    });
    
    it("Should emit IncorrectItemReceived event with correct parameters", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });
        await escrow.connect(seller).setSellerHasGivenItem();

        await expect(escrow.connect(buyer).setBuyerHasReceivedIncorrectItem())
            .to.emit(escrow, 'IncorrectItemReceived')
            .withArgs(buyer.address, buyerDepositAmount);
    });

})