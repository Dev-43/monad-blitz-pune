import { createPublicClient, http } from "viem";
import 'dotenv/config';

const client = createPublicClient({
  transport: http(process.env.MONAD_RPC_URL),
});

async function main() {
  const balance = await client.getBalance({ address: "0x3AB0a122E7c72db12525462cd41173AD2a615DE5" });
  console.log("Balance:", balance.toString());
}

main().catch(console.error);