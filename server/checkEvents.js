import { ethers } from 'ethers';

async function main() {
  const REGISTRY_ABI = [
    'event MemoryRootUpdated(string agentId, bytes32 newRoot, uint256 vectorCount, uint256 timestamp)'
  ];

  const provider = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');
  const registryAddress = '0xD896D59583C137D6ca2c5e3add025e143eD1030d'; 
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);

  try {
    const filter = registry.filters.MemoryRootUpdated('alpha_journal_agent_v1');
    const logs = await registry.queryFilter(filter, -100000); // Check last 100k blocks
    console.log('Total Memory Anchors found:', logs.length);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
