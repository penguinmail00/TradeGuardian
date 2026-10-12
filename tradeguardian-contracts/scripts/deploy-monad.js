// Deploys the Escrow implementation and EscrowFactory to Monad testnet or mainnet.
// Usage: npx hardhat run scripts/deploy-monad.js
// Prompts for the network, or pass --network monadTestnet / monadMainnet to skip the prompt.
const hre = require("hardhat");
const readline = require("readline");

// Keyed by the network names in hardhat.config.js, which hold the RPC URLs.
const NETWORKS = {
  monadTestnet: {
    label: "Monad testnet",
    chainId: 10143n,
    explorerUrl: "https://testnet.monadexplorer.com",
  },
  monadMainnet: {
    label: "Monad mainnet",
    chainId: 143n,
    explorerUrl: "https://monadscan.com",
  },
};

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

// Lets the user pick one of `choices` ({ label, value }) with the up and down
// arrow keys and Enter, redrawing the list in place.
function select(query, choices) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) {
    throw new Error(
      "Selecting needs an interactive terminal. Pass --network instead."
    );
  }

  return new Promise((resolve) => {
    let index = 0;
    const render = () => {
      for (const [i, choice] of choices.entries()) {
        const line =
          i === index ? `\x1b[36m❯ ${choice.label}\x1b[0m` : `  ${choice.label}`;
        stdout.write(`\x1b[2K${line}\n`);
      }
    };
    // Moves back to the top of the list so the next write replaces it.
    const clearList = () => stdout.write(`\x1b[${choices.length}A\x1b[0J`);

    const done = () => {
      stdin.removeListener("keypress", onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\x1b[?25h");
    };

    const onKeypress = (_str, key) => {
      if (!key) return;
      // Raw mode stops Ctrl+C from sending SIGINT, so exit here instead.
      if (key.ctrl && key.name === "c") {
        done();
        process.exit(130);
      }
      if (key.name === "up" || key.name === "down") {
        const step = key.name === "up" ? -1 : 1;
        index = (index + step + choices.length) % choices.length;
        clearList();
        render();
      } else if (key.name === "return") {
        clearList();
        stdout.write(`\x1b[1A\x1b[2K${query} ${choices[index].label}\n`);
        done();
        resolve(choices[index].value);
      }
    };

    stdout.write(`${query} \x1b[2m(use arrow keys, Enter to select)\x1b[0m\n\x1b[?25l`);
    render();
    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("keypress", onKeypress);
  });
}

async function selectNetwork() {
  // Hardhat's default network means no --network was passed, so ask.
  if (NETWORKS[hre.network.name]) return hre.network.name;

  return select(
    "Network:",
    Object.entries(NETWORKS).map(([value, { label }]) => ({ label, value }))
  );
}

async function main() {
  const { ethers } = hre;

  const networkName = await selectNetwork();
  const target = NETWORKS[networkName];
  // hardhat run binds ethers.provider to --network before the script starts,
  // so connect to the chosen network's RPC directly.
  const provider = new ethers.JsonRpcProvider(
    hre.config.networks[networkName].url
  );

  const { chainId } = await provider.getNetwork();
  if (chainId !== target.chainId) {
    throw new Error(
      `RPC is on chain ${chainId}, expected ${target.label} (${target.chainId}).`
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

  const deployer = ethers.HDNodeWallet.fromPhrase(phrase).connect(provider);
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const balance = await provider.getBalance(deployer.address);

  console.log(`Network:       ${target.label} (chain ${chainId})`);
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
  const feeData = await provider.getFeeData();
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
  console.log(`${target.explorerUrl}/address/${factory.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
