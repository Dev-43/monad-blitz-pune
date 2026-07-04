import { publicClient, walletClient } from "../src/lib/chain/viemClient";
import "dotenv/config";

async function main() {
  const address = walletClient?.account?.address || process.env.WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";
  console.log(`Checking connection to Monad Testnet for address: ${address}...`);

  try {
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });
    console.log(`Connection successful!`);
    console.log(`Address: ${address}`);
    console.log(`Balance: ${balance.toString()} MON (${Number(balance) / 1e18} MON)`);
  } catch (error) {
    console.error("Failed to connect or retrieve balance:", error);
    process.exit(1);
  }
}

main();
