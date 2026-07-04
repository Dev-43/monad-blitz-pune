import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";

// Define the Monad Testnet Chain according to the brief
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadExplorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
});

const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
let privateKey = process.env.PRIVATE_KEY;
if (privateKey && !privateKey.startsWith("0x")) {
  privateKey = `0x${privateKey}`;
}

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(rpcUrl),
});

export const walletClient = privateKey
  ? createWalletClient({
      account: privateKeyToAccount(privateKey as `0x${string}`),
      chain: monadTestnet,
      transport: http(rpcUrl),
    })
  : null;
