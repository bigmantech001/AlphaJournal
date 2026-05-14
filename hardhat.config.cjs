require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    "0g-mainnet": {
      url: "https://evmrpc.0g.ai",
      accounts: [process.env.VITE_PRIVATE_KEY],
      chainId: 16661,
    },
  },
};
