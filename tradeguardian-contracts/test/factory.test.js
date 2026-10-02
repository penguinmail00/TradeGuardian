// /test/factory.test.js

const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {
    loadFixture,
    deployEscrow,
    deployFactory,
    createEscrow,
    EscrowStates
} = require("./utils");

describe("EscrowFactory", function () {
    it("Should store the implementation and feeRecipient", async function () {
        const { factory, implementation, feeRecipient } = await loadFixture(deployEscrow);
        expect(await factory.implementation()).to.equal(await implementation.getAddress());
        expect(await factory.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should revert if the implementation is the zero address", async function () {
        const [feeRecipient] = await ethers.getSigners();
        await expect(ethers.deployContract("EscrowFactory", [ethers.ZeroAddress, feeRecipient.address]))
            .to.be.revertedWith("Implementation cannot be the zero address");
    });

    it("Should revert if the feeRecipient is the zero address", async function () {
        const implementation = await ethers.deployContract("Escrow");
        await expect(ethers.deployContract("EscrowFactory", [await implementation.getAddress(), ethers.ZeroAddress]))
            .to.be.revertedWith("Fee recipient cannot be the zero address");
    });

    it("Should emit EscrowCreated and record the clone", async function () {
        const [, seller, buyer] = await ethers.getSigners();
        const { factory } = await loadFixture(deployFactory);
        const itemPrice = ethers.parseEther("1");

        await expect(factory.createEscrow(seller.address, buyer.address, itemPrice))
            .to.emit(factory, "EscrowCreated")
            .withArgs(anyValue, seller.address, buyer.address, itemPrice);

        expect(await factory.escrowCount()).to.equal(1);
        expect(await factory.allEscrows(0)).to.properAddress;
    });

    it("Should set the factory's feeRecipient on each clone", async function () {
        const { escrow, feeRecipient } = await loadFixture(deployEscrow);
        expect(await escrow.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should give each clone independent state", async function () {
        const [, seller, buyer, thirdParty] = await ethers.getSigners();
        const { factory } = await loadFixture(deployFactory);
        const itemPrice = ethers.parseEther("1");

        const escrowA = await createEscrow(factory, seller.address, buyer.address, itemPrice);
        const escrowB = await createEscrow(factory, seller.address, thirdParty.address, itemPrice * 2n);

        expect(await escrowA.getAddress()).to.not.equal(await escrowB.getAddress());
        expect(await factory.escrowCount()).to.equal(2);

        await escrowA.connect(seller).sellerDeposit({ value: itemPrice });

        expect(await escrowA.userBalances(seller.address)).to.equal(itemPrice);
        expect(await escrowB.userBalances(seller.address)).to.equal(0);
        expect(await escrowB.buyer()).to.equal(thirdParty.address);
        expect(await escrowB.itemPrice()).to.equal(itemPrice * 2n);
        expect(await escrowB.currentState()).to.equal(EscrowStates.AWAITING_DEPOSIT);
    });

    it("Should revert if a clone is initialized twice", async function () {
        const { escrow, feeRecipient, seller, buyer, itemPrice } = await loadFixture(deployEscrow);
        await expect(escrow.initialize(feeRecipient.address, seller.address, buyer.address, itemPrice))
            .to.be.revertedWithCustomError(escrow, "InvalidInitialization");
    });

    it("Should revert if the implementation is initialized", async function () {
        const { implementation, feeRecipient, seller, buyer, itemPrice } = await loadFixture(deployEscrow);
        await expect(implementation.initialize(feeRecipient.address, seller.address, buyer.address, itemPrice))
            .to.be.revertedWithCustomError(implementation, "InvalidInitialization");
    });

    it("Should revert if the seller or buyer is the zero address", async function () {
        const [, seller, buyer] = await ethers.getSigners();
        const { factory } = await loadFixture(deployFactory);

        await expect(factory.createEscrow(ethers.ZeroAddress, buyer.address, 1n))
            .to.be.revertedWith("Seller and buyer cannot be the zero address");
        await expect(factory.createEscrow(seller.address, ethers.ZeroAddress, 1n))
            .to.be.revertedWith("Seller and buyer cannot be the zero address");
    });

    it("Should revert if the seller and buyer are the same", async function () {
        const [, seller] = await ethers.getSigners();
        const { factory } = await loadFixture(deployFactory);

        await expect(factory.createEscrow(seller.address, seller.address, 1n))
            .to.be.revertedWith("Seller and buyer must be different");
    });
});
