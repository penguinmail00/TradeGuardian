const { expect } = require("chai");
const {
    loadFixture,
    deployEscrow,
    BUYER_DEPOSIT_MULTIPLIER,
    FEE_PERCENTAGE,
    EscrowStates
} = require("./utils");

describe("Set buyer has correct item", function () {

    it("Should revert if called by non-buyer", async function () {
        const { escrow, seller } = await loadFixture(deployEscrow);

        await expect(escrow.connect(seller).setBuyerHasReceivedCorrectItem())
            .to.be.revertedWith("Only buyer can execute this");
    });

    it("Should revert if current state is not ITEM_SENT", async function () {
        const { escrow, buyer } = await loadFixture(deployEscrow);

        // Assuming initial state is AWAITING_DEPOSIT
        await expect(escrow.connect(buyer).setBuyerHasReceivedCorrectItem())
            .to.be.revertedWith("Invalid state for this action");
    });

    it("Should update the state to ITEM_RECEIVED", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });
        await escrow.connect(seller).setSellerHasGivenItem();
        await escrow.connect(buyer).setBuyerHasReceivedCorrectItem();

        const currentState = await escrow.currentState();
        expect(currentState).to.equal(EscrowStates.ITEM_RECEIVED);
    });

    it("Should transfer the correct amount to the seller", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });

        await escrow.connect(seller).setSellerHasGivenItem();

        const feeAmount = (itemPrice * FEE_PERCENTAGE) / 100n;
        const feePerParty = feeAmount / 2n;
        const sellerBalance = await escrow.userBalances(seller.address);
        const expectedPayoutToSeller = sellerBalance + itemPrice - feePerParty;

        const sellerWalletBalanceBefore = await ethers.provider.getBalance(seller.address);

        await escrow.connect(buyer).setBuyerHasReceivedCorrectItem();

        const sellerWalletBalanceAfter = await ethers.provider.getBalance(seller.address);

        expect(sellerWalletBalanceAfter - sellerWalletBalanceBefore).to.equal(expectedPayoutToSeller);
    });

    it("Should transfer the correct amount to the buyer", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });

        await escrow.connect(seller).setSellerHasGivenItem();

        const feeAmount = (itemPrice * FEE_PERCENTAGE) / 100n;
        const feePerParty = feeAmount / 2n;
        const buyerBalance = await escrow.userBalances(buyer.address);
        const expectedPayoutToBuyer = buyerBalance - itemPrice - feePerParty;

        const buyerWalletBalanceBefore = await ethers.provider.getBalance(buyer.address);

        const tx = await escrow.connect(buyer).setBuyerHasReceivedCorrectItem();
        const gasUsed = (await tx.wait()).gasUsed;
        const txCost = gasUsed * tx.gasPrice;

        const buyerWalletBalanceAfter = await ethers.provider.getBalance(buyer.address);

        expect(buyerWalletBalanceBefore + expectedPayoutToBuyer - txCost).to.equal(buyerWalletBalanceAfter);
    });

    it("Should transfer the correct amount to the fee recipient", async function () {
        const { escrow, buyer, seller, feeRecipient, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });

        await escrow.connect(seller).setSellerHasGivenItem();

        const feeAmount = (itemPrice * FEE_PERCENTAGE) / 100n;

        const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);

        await escrow.connect(buyer).setBuyerHasReceivedCorrectItem();

        const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);

        expect(feeRecipientBalanceBefore + feeAmount).to.equal(feeRecipientBalanceAfter);
    });

    it("Should emit CorrectItemReceived event with correct parameters", async function () {
        const { escrow, buyer, seller, itemPrice } = await loadFixture(deployEscrow);
        const buyerDepositAmount = itemPrice * BUYER_DEPOSIT_MULTIPLIER;
        const sellerDepositAmount = itemPrice;

        await escrow.connect(buyer).buyerDeposit({ value: buyerDepositAmount });
        await escrow.connect(seller).sellerDeposit({ value: sellerDepositAmount });
        await escrow.connect(seller).setSellerHasGivenItem();

        const totalFeeAmount = (itemPrice * FEE_PERCENTAGE) / 100n;
        const feePerParty = totalFeeAmount / 2n;

        const sellerTotalBeforeFee = itemPrice + await escrow.userBalances(seller.address);
        const expectedPayoutAmountToSeller = sellerTotalBeforeFee - feePerParty;

        const buyerBalance = await escrow.userBalances(buyer.address);
        const expectedAmountReturnedToBuyer = buyerBalance - itemPrice - feePerParty;

        await expect(escrow.connect(buyer).setBuyerHasReceivedCorrectItem())
            .to.emit(escrow, 'CorrectItemReceived')
            .withArgs(buyer.address, seller.address, totalFeeAmount, expectedPayoutAmountToSeller, expectedAmountReturnedToBuyer);
    });

    it("Should complete and pay out the full balance when the fee is odd", async function () {
        const [feeRecipient, seller, buyer] = await ethers.getSigners();
        // 1% of 300 wei is 3 wei, which cannot be split evenly between the two parties
        const itemPrice = 300n;
        const Escrow = await ethers.getContractFactory("Escrow");
        const escrow = await Escrow.deploy(feeRecipient.address, seller.address, buyer.address, itemPrice);

        await escrow.connect(buyer).buyerDeposit({ value: itemPrice * BUYER_DEPOSIT_MULTIPLIER });
        await escrow.connect(seller).sellerDeposit({ value: itemPrice });
        await escrow.connect(seller).setSellerHasGivenItem();

        const totalFee = (itemPrice * FEE_PERCENTAGE) / 100n;
        const totalDeposited = itemPrice * BUYER_DEPOSIT_MULTIPLIER + itemPrice;

        await expect(escrow.connect(buyer).setBuyerHasReceivedCorrectItem()).to.changeEtherBalances(
            [escrow, feeRecipient],
            [-totalDeposited, totalFee]
        );
        expect(await escrow.currentState()).to.equal(EscrowStates.ITEM_RECEIVED);
    });

    describe("Fee split across item prices", function () {
        const cases = [
            { name: "a fee that rounds to zero (99 wei)", itemPrice: 99n },
            { name: "a fee of 1 wei (100 wei)", itemPrice: 100n },
            { name: "a fee of 1 wei with a remainder (199 wei)", itemPrice: 199n },
            { name: "an even fee of 2 wei (200 wei)", itemPrice: 200n },
            { name: "an odd fee of 3 wei (300 wei)", itemPrice: 300n },
            { name: "an even fee (1 ETH)", itemPrice: ethers.parseEther("1") },
            { name: "an odd fee on a large price (1000 ETH + 100 wei)", itemPrice: ethers.parseEther("1000") + 100n },
            { name: "an odd fee on a full-precision price", itemPrice: 12345678901234567n }
        ];

        async function deployAndShipItem(itemPrice) {
            const [feeRecipient, seller, buyer] = await ethers.getSigners();
            const Escrow = await ethers.getContractFactory("Escrow");
            const escrow = await Escrow.deploy(feeRecipient.address, seller.address, buyer.address, itemPrice);

            await escrow.connect(buyer).buyerDeposit({ value: itemPrice * BUYER_DEPOSIT_MULTIPLIER });
            await escrow.connect(seller).sellerDeposit({ value: itemPrice });
            await escrow.connect(seller).setSellerHasGivenItem();

            return { escrow, feeRecipient, seller, buyer };
        }

        for (const { name, itemPrice } of cases) {
            it(`Should pay out exactly the escrowed balance with ${name}`, async function () {
                const { escrow, feeRecipient, seller, buyer } = await deployAndShipItem(itemPrice);

                const totalFee = (itemPrice * FEE_PERCENTAGE) / 100n;
                const sellerFeeShare = totalFee / 2n;
                const buyerFeeShare = totalFee - sellerFeeShare;
                const amountToSeller = itemPrice * 2n - sellerFeeShare;
                const amountToBuyer = itemPrice * (BUYER_DEPOSIT_MULTIPLIER - 1n) - buyerFeeShare;

                // The two shares cover the whole fee and differ by at most 1 wei
                expect(sellerFeeShare + buyerFeeShare).to.equal(totalFee);
                expect(buyerFeeShare - sellerFeeShare).to.be.oneOf([0n, 1n]);

                const tx = escrow.connect(buyer).setBuyerHasReceivedCorrectItem();

                await expect(tx).to.changeEtherBalances(
                    [escrow, feeRecipient, seller, buyer],
                    [-(itemPrice * BUYER_DEPOSIT_MULTIPLIER + itemPrice), totalFee, amountToSeller, amountToBuyer]
                );
                await expect(tx)
                    .to.emit(escrow, "CorrectItemReceived")
                    .withArgs(buyer.address, seller.address, totalFee, amountToSeller, amountToBuyer);

                expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0);
                expect(await escrow.userBalances(seller.address)).to.equal(0);
                expect(await escrow.userBalances(buyer.address)).to.equal(0);
                expect(await escrow.currentState()).to.equal(EscrowStates.ITEM_RECEIVED);
            });
        }
    });
});
