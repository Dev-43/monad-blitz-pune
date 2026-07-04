require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../crosscheck/.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

if (!PRIVATE_KEY) {
  console.error("⚠️ PRIVATE_KEY not found in ../crosscheck/.env!");
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      viaIR: true
    },
  },
  networks: {
    monadTestnet: {
      url: MONAD_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
