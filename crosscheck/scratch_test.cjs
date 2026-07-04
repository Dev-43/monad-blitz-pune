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

async function check() {
  const address = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
  const client = createPublicClient({
    chain: monadTestnet,
    transport: http("https://testnet-rpc.monad.xyz"),
  });
  
  try {
    // Query ERC-1967 implementation slot
    const slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const value = await client.getStorageAt({
      address,
      slot,
    });
    console.log("Storage value at ERC-1967 slot:", value);
    
    // Also try EIP-1967 beacon slot
    const beaconSlot = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
    const beaconValue = await client.getStorageAt({
      address,
      slot: beaconSlot,
    });
    console.log("Storage value at EIP-1967 beacon slot:", beaconValue);
  } catch (err) {
    console.log("Error querying storage:", err.message);
  }
}

check();
