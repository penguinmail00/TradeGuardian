// Deploys the Escrow implementation and EscrowFactory to Monad testnet.
// Usage: npx hardhat run scripts/deploy-monad-testnet.js --network monadTestnet
const hre = require("hardhat");
const readline = require("readline");

const MONAD_TESTNET_CHAIN_ID = 10143n;
const EXPLORER_URL = "https://testnet.monadexplorer.com";

// Reads a line from the terminal without echoing it, so the mnemonic
// never shows up on screen or in scrollback.
function promptHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let muted = false;
    rl._writeToOutput = (str) => {
      if (!muted) rl.output.write(str);
    };
    rl.question(query, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

function prompt(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const { ethers, network } = hre;

  const { chainId } = await ethers.provider.getNetwork();
  if (chainId !== MONAD_TESTNET_CHAIN_ID) {
    throw new Error(
      `Connected to chain ${chainId}, expected Monad testnet (${MONAD_TESTNET_CHAIN_ID}). ` +
        "Run with --network monadTestnet."
    );
  }

  const phrase = (await promptHidden("Enter deployer mnemonic: "))
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join(" ");
  if (!ethers.Mnemonic.isValidMnemonic(phrase)) {
    throw new Error("Invalid mnemonic.");
  }

  const deployer = ethers.HDNodeWallet.fromPhrase(phrase).connect(
    ethers.provider
  );
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network:       ${network.name} (chain ${chainId})`);
  console.log(`Deployer:      ${deployer.address}`);
  console.log(`Balance:       ${ethers.formatEther(balance)} MON`);
  console.log(`Fee recipient: ${feeRecipient}`);

  // The factory constructor needs the implementation address, which doesn't
  // exist yet, so estimate it with the deployer address as a stand-in.
  const escrowFactory = await ethers.getContractFactory("Escrow", deployer);
  const factoryFactory = await ethers.getContractFactory(
    "EscrowFactory",
    deployer
  );
  const escrowGas = await deployer.estimateGas(
    await escrowFactory.getDeployTransaction()
  );
  const factoryGas = await deployer.estimateGas(
    await factoryFactory.getDeployTransaction(deployer.address, feeRecipient)
  );
  const totalGas = escrowGas + factoryGas;

  // Monad charges for the gas limit, and ethers sets the limit from this same
  // estimate, so the estimated cost should be close to what is charged.
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  const maxFeePerGas = feeData.maxFeePerGas ?? gasPrice;
  const estimatedCost = totalGas * gasPrice;
  const maxCost = totalGas * maxFeePerGas;

  console.log(`Gas:           ${escrowGas} (Escrow) + ${factoryGas} (EscrowFactory) = ${totalGas}`);
  console.log(`Gas price:     ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Est. cost:     ${ethers.formatEther(estimatedCost)} MON (max ${ethers.formatEther(maxCost)} MON)`);

  if (balance < maxCost) {
    throw new Error(
      `Balance ${ethers.formatEther(balance)} MON does not cover the max cost ` +
        `of ${ethers.formatEther(maxCost)} MON.`
    );
  }

  const confirm = await prompt("Deploy? (y/N) ");
  if (confirm.trim().toLowerCase() !== "y") {
    console.log("Aborted.");
    return;
  }

  const implementation = await ethers.deployContract("Escrow", [], deployer);
  await implementation.waitForDeployment();
  console.log(`Escrow implementation deployed to ${implementation.target}`);

  const factory = await ethers.deployContract(
    "EscrowFactory",
    [implementation.target, feeRecipient],
    deployer
  );
  await factory.waitForDeployment();
  console.log(`EscrowFactory deployed to ${factory.target}`);
  console.log(`${EXPLORER_URL}/address/${factory.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
