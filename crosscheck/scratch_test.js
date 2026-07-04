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

const rpcs = [
  "https://rpc-testnet.monadinfra.com",
  "https://testnet-rpc.monad.xyz",
  "https://monad-testnet.drpc.org"
];

async function check() {
  const address = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
  for (const url of rpcs) {
    try {
      const client = createPublicClient({
        chain: monadTestnet,
        transport: http(url),
      });
      const code = await client.getBytecode({ address });
      console.log(`RPC: ${url} | Code length: ${code ? code.length : 0}`);
    } catch (err) {
      console.log(`RPC: ${url} | Error: ${err.message}`);
    }
  }
}

check();
