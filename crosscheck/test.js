import "dotenv/config";
import { createPublicClient, http } from "viem";

const rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const address = process.env.WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";

const client = createPublicClient({
  transport: http(rpcUrl),
});

const balance = await client.getBalance({ address });
console.log("Balance:", balance.toString());