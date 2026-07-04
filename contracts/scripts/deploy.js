import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment of MonadNFT on Monad Testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} MON`);

  // Compile contract
  console.log("🛠️  Compiling contracts...");
  await hre.run("compile");

  // Get contract factory
  const MonadNFT = await hre.ethers.getContractFactory("MonadNFT");

  // Deploy contract
  console.log("📡 Deploying MonadNFT...");
  const contract = await MonadNFT.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ MonadNFT deployed to: ${contractAddress}`);

  // Wait for 5 blocks to ensure transaction propagates
  console.log("⏳ Waiting for transaction confirmation blocks...");
  const tx = contract.deploymentTransaction();
  if (tx) {
    await tx.wait(2);
  }

  // Verification process
  console.log("🔍 Starting smart contract verification...");
  try {
    const buildInfoDir = path.join(process.cwd(), "artifacts", "build-info");
    const files = fs.readdirSync(buildInfoDir);
    const buildInfoFile = files.find(f => f.endsWith(".json"));
    if (!buildInfoFile) {
      throw new Error("Build info file not found");
    }

    const buildInfoPath = path.join(buildInfoDir, buildInfoFile);
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));

    const standardJsonInput = buildInfo.input;
    const contractPath = "contracts/MonadNFT.sol";
    const contractName = "MonadNFT";
    
    const outputContract = buildInfo.output.contracts[contractPath][contractName];
    if (!outputContract) {
      throw new Error(`Contract metadata not found in build info for ${contractPath}:${contractName}`);
    }

    const foundryMetadata = JSON.parse(outputContract.metadata);

    const payload = {
      chainId: 10143,
      contractAddress: contractAddress,
      contractName: `${contractPath}:${contractName}`,
      compilerVersion: "v0.8.24+commit.e11b9ed9",
      standardJsonInput: standardJsonInput,
      foundryMetadata: foundryMetadata
    };

    console.log("📤 Submitting verification payload to Monad Verification API...");
    
    const response = await fetch("https://agents.devnads.com/v1/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resultText = await response.text();
    console.log(`📥 Verification Response Status: ${response.status}`);
    console.log(`📥 Verification Response: ${resultText}`);
    
    if (response.ok) {
      console.log("🎉 Verification request sent successfully!");
    } else {
      console.warn("⚠️ Verification request failed. Try manual verification.");
    }
  } catch (error) {
    console.error("❌ Error during verification:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
