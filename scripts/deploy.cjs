const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log("  Deploying AlphaJournalAccess");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Deployer:  ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:   ${hre.ethers.formatEther(balance)} 0G`);
  console.log("");

  const Contract = await hre.ethers.getContractFactory("AlphaJournalAccess");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`  ✅ Deployed: ${address}`);
  console.log("");
  console.log("  Add to your .env:");
  console.log(`  ACCESS_CONTRACT_ADDRESS=${address}`);
  console.log(`  VITE_ACCESS_CONTRACT=${address}`);
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
