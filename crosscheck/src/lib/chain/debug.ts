// Final e2e test of writeReputationFeedback
import { writeReputationFeedback } from "./erc8004";
import { walletClient } from "./viemClient";
import type { ReviewerVerdict } from "../shared/types";

async function main() {
  if (!walletClient) {
    console.error("Wallet client not initialized!");
    return;
  }

  const testVerdict: ReviewerVerdict = {
    agentId: walletClient.account.address,
    bugId: "clean-bug-001",
    passed: true,
    cheatDetected: false,
    reason: "All tests pass cleanly with correct patch",
    testCountBefore: 5,
    testCountAfter: 5,
    verdictHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
    timestamp: Date.now(),
  };

  console.log("Running final e2e test of writeReputationFeedback...");
  try {
    const result = await writeReputationFeedback(testVerdict);
    console.log("\n✅ SUCCESS!");
    console.log("  txHash:", result.txHash);
    console.log("  newScore:", result.newScore);
  } catch (err: any) {
    console.error("\n❌ FAILED:", err.message);
  }
}

main().catch(console.error);
