const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;

  const implementation = await hre.ethers.deployContract("Escrow");
  await implementation.waitForDeployment();
  console.log(`Escrow implementation deployed to ${implementation.target}`);

  const factory = await hre.ethers.deployContract("EscrowFactory", [
    implementation.target,
    feeRecipient,
  ]);
  await factory.waitForDeployment();
  console.log(
    `EscrowFactory deployed to ${factory.target} with fee recipient ${feeRecipient}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
