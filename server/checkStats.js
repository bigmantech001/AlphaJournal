import { ethers } from 'ethers';

async function main() {
  const REGISTRY_ABI = [
    'function getAgent(string agentId) external view returns (address, string, bytes32, uint256, uint256)',
    'function getAgentCount() external view returns (uint256)',
  ];

  const provider = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');
  const registryAddress = '0xD896D59583C137D6ca2c5e3add025e143eD1030d'; // From .env
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);

  const AGENT_ID = 'alpha_journal_agent_v1';
  try {
    const data = await registry.getAgent(AGENT_ID);
    console.log('Agent Data:', data);
    console.log('Vector Count (Memories):', Number(data[3]));
  } catch (err) {
    console.error('Error fetching agent:', err.message);
  }
}

main();
