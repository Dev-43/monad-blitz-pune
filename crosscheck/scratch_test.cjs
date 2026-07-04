const { createPublicClient, http } = require("viem");
const { defineChain } = require("viem");

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { decimals: 18, name: "MON", symbol: "MON" },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
});

const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
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
];

async function check() {
  const addressToCheck = "0xca4CE2169d4fFee7c2560A136Df4cc9792eebD74";
  const client = createPublicClient({
    chain: monadTestnet,
    transport: http("https://testnet-rpc.monad.xyz"),
  });
  
  try {
    const res = await client.readContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "resolveAgentByAddress",
      args: [addressToCheck],
    });
    console.log("SUCCESS. Return value:", res);
  } catch (err) {
    console.log("ERROR calling resolveAgentByAddress:", err.message);
  }
}

check();
