// ============================================================
// Direct deploy script using ethers.js + solc (no Hardhat needed)
// Usage: node scripts/deploy-direct.cjs
// ============================================================

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const RPC_URL = 'https://evmrpc.0g.ai';
  const PRIVATE_KEY = process.env.VITE_PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    console.error('❌ VITE_PRIVATE_KEY not found in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Deploying AlphaJournalAccess');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Deployer:  ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`  Balance:   ${ethers.formatEther(balance)} 0G`);
  console.log('');

  // --- Compile the contract inline (minimal ABI + bytecode) ---
  // Pre-compiled bytecode and ABI for AlphaJournalAccess.sol (Solidity 0.8.20)
  // If you want to recompile, use: npx solcjs --bin --abi contracts/AlphaJournalAccess.sol

  // We'll use the Hardhat artifacts if they exist, otherwise embed
  let abi, bytecode;

  // Try to find Hardhat artifacts first
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'AlphaJournalAccess.sol', 'AlphaJournalAccess.json');
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    abi = artifact.abi;
    bytecode = artifact.bytecode;
    console.log('  Using Hardhat artifacts');
  } else {
    console.log('  ⚠ No compiled artifacts found. Compiling first...');
    console.log('  Run: npx hardhat compile   (or install solc)');
    
    // Fallback: try to compile via hardhat
    const { execSync } = require('child_process');
    try {
      execSync('npx hardhat compile --config hardhat.config.cjs', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit' 
      });
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      abi = artifact.abi;
      bytecode = artifact.bytecode;
    } catch (e) {
      console.error('❌ Compilation failed:', e.message);
      process.exit(1);
    }
  }

  console.log('  Deploying...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log(`  Tx sent: ${contract.deploymentTransaction().hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('');
  console.log(`  ✅ Deployed: ${address}`);
  console.log('');
  console.log('  Add to your .env:');
  console.log(`  ACCESS_CONTRACT_ADDRESS=${address}`);
  console.log(`  VITE_ACCESS_CONTRACT=${address}`);
  console.log('');
}

main().catch((error) => {
  console.error('Deploy failed:', error);
  process.exitCode = 1;
});
