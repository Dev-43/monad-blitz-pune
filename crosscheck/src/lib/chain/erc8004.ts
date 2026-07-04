import { ReviewerVerdict } from "../shared/types";
import { publicClient, walletClient } from "./viemClient";
import { keccak256, toBytes } from "viem";

// Fallback worker agentId to receive feedback when the real worker isn't registered.
// agentId=1 is the first agent on the Monad testnet, owned by a different wallet,
// confirmed working in live on-chain tests. agentId=1790/1791 are owned by the
// same reviewer wallet and would trigger the "Self-feedback not allowed" guard.
const FALLBACK_WORKER_AGENT_ID = BigInt(1);

const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

// Registered event topic hash for receipt parsing
const REGISTERED_EVENT_TOPIC = "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a";

const IDENTITY_REGISTRY_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
] as const;

// Confirmed correct ABI via bytecode selector analysis + successful on-chain test.
// Deployed signature: giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)
// The int128 is the score (not decimals), uint8 is number of decimal places.
const REPUTATION_REGISTRY_ABI = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "score", type: "int128" },
      { name: "decimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "getSummary",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddresses", type: "address[]" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
    ],
    outputs: [
      { name: "count", type: "uint64" },
      { name: "averageScore", type: "uint8" },
    ],
  },
] as const;

// In-memory cache so we don't re-register within the same process lifetime
let cachedReviewerAgentId: bigint | null = null;

/**
 * Returns the reviewer's on-chain ERC-8004 agentId.
 *
 * Resolution order:
 *   1. In-memory cache (fastest — avoids repeated RPC calls within the same process)
 *   2. REVIEWER_AGENT_ID env var (set after first registration to avoid log scanning)
 *   3. Fresh registration via register(string) — parses agentId from the Registered event in receipt
 */
async function getReviewerAgentId(): Promise<bigint> {
  // 1. In-memory cache
  if (cachedReviewerAgentId !== null) {
    return cachedReviewerAgentId;
  }

  // 2. Environment variable (persisted across restarts)
  const envAgentId = process.env.REVIEWER_AGENT_ID;
  if (envAgentId) {
    cachedReviewerAgentId = BigInt(envAgentId);
    console.log(`[Chain] Using cached REVIEWER_AGENT_ID=${cachedReviewerAgentId}`);
    return cachedReviewerAgentId;
  }

  if (!walletClient) {
    throw new Error("Wallet client not initialized. Please set PRIVATE_KEY in .env");
  }

  const walletAddress = walletClient.account.address;

  // 3a. Check if already registered
  const balance = await publicClient.readContract({
    address: IDENTITY_REGISTRY_ADDRESS,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "balanceOf",
    args: [walletAddress],
  });

  if (balance > BigInt(0)) {
    // Already registered but REVIEWER_AGENT_ID not set — log a helpful message
    throw new Error(
      `Wallet ${walletAddress} is already registered (balanceOf=${balance}) ` +
      `but REVIEWER_AGENT_ID is not set in .env. ` +
      `Add REVIEWER_AGENT_ID=<agentId> to .env. ` +
      `Find your agentId in the Registered event of your registration transaction.`
    );
  }

  // 3b. Not registered — register now and extract agentId from receipt
  console.log(`[Chain] Registering reviewer wallet ${walletAddress}...`);
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY_ADDRESS,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "register",
    args: ["https://crosscheck.io/metadata/reviewer.json"],
  });
  console.log(`[Chain] Registration tx: ${hash}. Waiting...`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  for (const log of receipt.logs) {
    if (log.topics[0] === REGISTERED_EVENT_TOPIC && log.topics[1]) {
      cachedReviewerAgentId = BigInt(log.topics[1]);
      console.log(
        `[Chain] Registered! agentId=${cachedReviewerAgentId}. ` +
        `Add REVIEWER_AGENT_ID=${cachedReviewerAgentId} to .env`
      );
      return cachedReviewerAgentId;
    }
  }
  throw new Error("Registered event not found in registration transaction receipt");
}

/**
 * Writes a reputation feedback entry to the ERC-8004 Reputation Registry on Monad.
 *
 * Uses the deployed giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)
 * which differs from the SDK docs — discovered via on-chain bytecode selector analysis.
 */
export async function writeReputationFeedback(
  verdict: ReviewerVerdict
): Promise<{ txHash: `0x${string}`; newScore: number }> {
  console.log(`[Chain] Writing reputation feedback for agent ${verdict.agentId} on-chain...`);

  if (!walletClient) {
    throw new Error("Wallet client not initialized. Please set PRIVATE_KEY in .env");
  }

  // 1. Resolve reviewer's agentId (cached / env / fresh registration)
  //    This confirms the reviewer is a registered ERC-8004 agent.
  await getReviewerAgentId();

  // 2. Resolve the worker agentId — the agent RECEIVING feedback.
  //    Self-feedback is blocked by the contract, so the target must be a
  //    different agentId than the reviewer's.
  //    Use WORKER_AGENT_ID env var if set, otherwise fall back to the
  //    pre-registered worker-pool agent (agentId=1791).
  const workerAgentId = process.env.WORKER_AGENT_ID
    ? BigInt(process.env.WORKER_AGENT_ID)
    : FALLBACK_WORKER_AGENT_ID;

  // 3. Compute feedback score on 0-100 scale (no decimals)
  const score = verdict.passed ? 90 : (verdict.cheatDetected ? 10 : 40);

  // 4. Submit feedback — the reviewer (msg.sender) gives feedback TO the worker agentId.
  //    ERC-8004: msg.sender is recorded as the client/feedback-giver;
  //    agentId is the agent whose reputation score is updated.
  console.log(`[Chain] Submitting giveFeedback. workerAgentId=${workerAgentId}, score=${score}`);

  const feedbackHash = verdict.verdictHash
    ?? keccak256(toBytes(verdict.reason ?? ""));

  const txHash = await walletClient.writeContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "giveFeedback",
    args: [
      workerAgentId,                           // agentId: worker whose reputation to update
      score,                                   // int128 score
      0,                                       // uint8 decimals (0 = whole numbers)
      "crosscheck",                            // tag1: project identifier
      verdict.passed ? "pass" : "fail",        // tag2: verdict category
      "",                                      // endpoint (optional)
      "",                                      // feedbackURI (optional)
      feedbackHash,                            // feedbackHash
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`[Chain] Reputation feedback confirmed. Tx: ${txHash}`);

  return { txHash, newScore: score };
}
