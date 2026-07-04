import { ReviewerVerdict } from "../shared/types";
import { publicClient, walletClient } from "./viemClient";

const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

const IDENTITY_REGISTRY_ABI = [
  {
    name: "resolveAgentByAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentAddress", type: "address" }],
    outputs: [
      { name: "agentId_", type: "uint256" },
      { name: "agentDomain_", type: "string" },
      { name: "agentAddress_", type: "address" },
    ],
  },
  {
    name: "newAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentDomain", type: "string" },
      { name: "agentAddress", type: "address" },
    ],
    outputs: [{ name: "agentId_", type: "uint256" }],
  },
] as const;

const REPUTATION_REGISTRY_ABI = [
  {
    name: "acceptFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentClientId", type: "uint256" },
      { name: "agentServerId", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/**
 * Writes a feedback entry to the ERC-8004 Reputation Registry.
 * Address and ABI are from the Monad ERC-8004 standard documentation.
 */
export async function writeReputationFeedback(
  verdict: ReviewerVerdict
): Promise<{ txHash: `0x${string}`; newScore: number }> {
  console.log(`[Chain] Writing reputation feedback for agent ${verdict.agentId} on-chain...`);

  if (!walletClient) {
    throw new Error("Wallet client is not initialized. Please verify PRIVATE_KEY in .env");
  }

  const walletAddress = walletClient.account.address;

  // 1. Resolve or register the server agent (our throwaway wallet address)
  let agentServerId: bigint = BigInt(0);
  try {
    const res = await publicClient.readContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "resolveAgentByAddress",
      args: [walletAddress],
    });
    agentServerId = res[0];
  } catch (error) {
    console.log(`[Chain] Reviewer wallet ${walletAddress} not registered. Registering...`);
    const hash = await walletClient.writeContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "newAgent",
      args: ["crosscheck-reviewer", walletAddress],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const res = await publicClient.readContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "resolveAgentByAddress",
      args: [walletAddress],
    });
    agentServerId = res[0];
  }

  // 2. Resolve or register the client agent (the worker agent)
  let agentClientId: bigint = BigInt(0);
  try {
    const res = await publicClient.readContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "resolveAgentByAddress",
      args: [verdict.agentId],
    });
    agentClientId = res[0];
  } catch (error) {
    console.log(`[Chain] Worker agent ${verdict.agentId} not registered. Registering...`);
    const hash = await walletClient.writeContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "newAgent",
      args: ["crosscheck-worker", verdict.agentId],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const res = await publicClient.readContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "resolveAgentByAddress",
      args: [verdict.agentId],
    });
    agentClientId = res[0];
  }

  console.log(`[Chain] Submitting feedback. Client ID: ${agentClientId}, Server ID: ${agentServerId}`);

  // 3. Write feedback entry to Reputation Registry
  const txHash = await walletClient.writeContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "acceptFeedback",
    args: [agentClientId, agentServerId],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`[Chain] Reputation feedback submitted successfully. Tx: ${txHash}`);

  return {
    txHash,
    newScore: verdict.passed ? 90 : 40,
  };
}
