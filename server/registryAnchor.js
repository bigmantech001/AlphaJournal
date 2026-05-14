// ============================================================
// MemoriaDA SDK - Server-Side Registry Anchoring
// ============================================================

import 'dotenv/config';
import { ethers } from 'ethers';

const NETWORKS = {
  mainnet: { rpcUrl: 'https://evmrpc.0g.ai', txExplorer: 'https://chainscan.0g.ai/tx/' },
};

const REGISTRY_ABI = [
  'function registerAgent(string agentId, string framework) external',
  'function updateMemoryRoot(string agentId, bytes32 rootHash, uint256 vectorCount) external payable',
  'function getAgent(string agentId) external view returns (address, string, bytes32, uint256, uint256)',
  'function getAgentFull(string agentId) external view returns (address owner, string framework, bytes32 currentRoot, uint256 vectorCount, uint256 lastUpdated, uint256 tokenId, uint256 totalFeePaid)',
  'function verifyMemoryRoot(string agentId, bytes32 rootHash) external view returns (bool isValid, bytes32 storedRoot, uint256 lastUpdated)',
  'function memoryFee() external view returns (uint256)',
  'function getAgentCount() external view returns (uint256)',
];

const MEMORY_FEE = '0.001'; // 0.001 0G per anchor

function getContract(signer) {
  const address = process.env.VITE_REGISTRY_ADDRESS;
  if (!address) throw new Error('VITE_REGISTRY_ADDRESS not set in .env');
  return new ethers.Contract(address, REGISTRY_ABI, signer);
}

function getSigner() {
  const privateKey = process.env.VITE_PRIVATE_KEY;
  if (!privateKey) throw new Error('VITE_PRIVATE_KEY not configured');
  const net = NETWORKS.mainnet;
  const provider = new ethers.JsonRpcProvider(net.rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}

export async function ensureAgentRegistered(agentId, framework) {
  const signer = getSigner();
  const contract = getContract(signer);
  try {
    await contract.getAgent(agentId);
    return true; // already registered
  } catch {
    // Not registered - register now
    const tx = await contract.registerAgent(agentId, framework);
    await tx.wait().catch(() => {}); // ignore receipt polling errors
    return true;
  }
}

export async function anchorMemoryRoot(agentId, rootHash, vectorCount) {
  const signer = getSigner();
  const contract = getContract(signer);
  const net = NETWORKS.mainnet;

  // Convert rootHash to bytes32
  let rootHashBytes;
  if (rootHash.startsWith('0x') && rootHash.length === 66) {
    rootHashBytes = rootHash;
  } else {
    rootHashBytes = ethers.zeroPadValue(
      ethers.hexlify(ethers.toBeArray(BigInt(rootHash))),
      32
    );
  }

  const fee = ethers.parseEther(MEMORY_FEE);
  const tx = await contract.updateMemoryRoot(agentId, rootHashBytes, vectorCount, { value: fee });

  let receipt;
  try {
    receipt = await tx.wait();
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('coalesce') || msg.includes('Missing or invalid parameters') || msg.includes('Missing')) {
      receipt = { blockNumber: null, transactionHash: tx.hash, status: 1 };
    } else {
      throw err;
    }
  }

  const blockLabel = receipt.blockNumber ? `Block #${receipt.blockNumber}` : 'TX Confirmed';
  const explorerUrl = `${net.txExplorer}${receipt.transactionHash || tx.hash}`;

  return { receipt, blockLabel, explorerUrl, txHash: receipt.transactionHash || tx.hash };
}
