// ============================================================
// MemoriaDA SDK - Server-Side 0G Storage Upload
// ============================================================

import 'dotenv/config';

const MAINNET_CONFIG = {
  rpcUrl: 'https://evmrpc.0g.ai',
  indexerRpc: 'https://indexer-storage-turbo.0g.ai',
  flowContract: '0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526',
};

export async function uploadMemoryBlob(payloadJson) {
  const privateKey = process.env.VITE_PRIVATE_KEY;
  if (!privateKey) throw new Error('VITE_PRIVATE_KEY not configured in .env');

  const net = MAINNET_CONFIG;

  const sdk = await import('@0gfoundation/0g-ts-sdk');
  const { ethers } = await import('ethers');

  const ZgBlob = sdk.Blob || sdk.ZgBlob;
  if (!ZgBlob) throw new Error('0G SDK: could not find Blob/ZgBlob export');

  const nodeBlob = new Blob([payloadJson], { type: 'application/json' });
  const zgBlob = new ZgBlob(nodeBlob);

  const [tree, treeErr] = await zgBlob.merkleTree();
  if (treeErr) throw new Error(`Merkle tree failed: ${treeErr.message}`);
  const rootHash = tree.rootHash();

  const provider = new ethers.JsonRpcProvider(net.rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const indexer = new sdk.Indexer(net.indexerRpc);
  const [tx, uploadErr] = await indexer.upload(zgBlob, net.rpcUrl, signer, {});

  if (uploadErr) {
    const msg = uploadErr.message || '';
    if (
      !msg.includes('eth_getTransactionReceipt') &&
      !msg.includes('Missing or invalid parameters')
    ) {
      throw uploadErr;
    }
  }

  return { rootHash, tx: tx || null, blobSize: nodeBlob.size };
}
