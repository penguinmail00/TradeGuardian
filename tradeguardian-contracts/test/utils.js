const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const TWO_HOURS_IN_SECS = 7200;
const ONE_WEI = ethers.parseEther("0.000000000000000001");
const BUYER_DEPOSIT_MULTIPLIER = 2n;
const PERCENTAGE_RETURNED_TO_BUYER = 25n;
const FEE_PERCENTAGE = 1n;
const EscrowStates = {
    AWAITING_DEPOSIT: 0,
    AWAITING_DELIVERY: 1,
    ITEM_SENT: 2,
    ITEM_INCORRECT: 3,
    ITEM_RECEIVED: 4,
    SETTLED: 5,
    CANCELED: 6
};

async function deployFactory() {
    const [feeRecipient] = await ethers.getSigners();

    const implementation = await ethers.deployContract("Escrow");
    const factory = await ethers.deployContract("EscrowFactory", [
        await implementation.getAddress(),
        feeRecipient.address
    ]);

    return { factory, implementation };
}

async function createEscrow(factory, seller, buyer, itemPrice) {
    const tx = await factory.createEscrow(seller, buyer, itemPrice);
    const receipt = await tx.wait();
    const event = receipt.logs
        .map((log) => factory.interface.parseLog(log))
        .find((parsed) => parsed?.name === "EscrowCreated");

    return ethers.getContractAt("Escrow", event.args.escrow);
}

async function deployEscrowWithPrice(itemPrice) {
    const [feeRecipient, seller, buyer, thirdParty] = await ethers.getSigners();

    const { factory, implementation } = await deployFactory();
    const escrow = await createEscrow(factory, seller.address, buyer.address, itemPrice);

    return { escrow, factory, implementation, feeRecipient, seller, buyer, thirdParty, itemPrice };
}

async function deployEscrow() {
    return deployEscrowWithPrice(ethers.parseEther("1"));
}

module.exports = {
    TWO_HOURS_IN_SECS,
    ONE_WEI,
    BUYER_DEPOSIT_MULTIPLIER,
    PERCENTAGE_RETURNED_TO_BUYER,
    FEE_PERCENTAGE,
    EscrowStates,
    loadFixture,
    deployFactory,
    createEscrow,
    deployEscrowWithPrice,
    deployEscrow
};
