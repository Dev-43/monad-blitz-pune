# CrossCheck

**An independent reviewer agent that catches AI coding agents cutting corners — by actually running the tests, not reading the diff — and writes the verdict on-chain so trust and payment move together, automatically.**

*Built for Monad Blitz Pune V2*

---

## The Problem

AI coding agents are now routinely hired to fix bugs autonomously, but there's no reliable way to know if a fix actually works before paying for it or trusting the agent again. Reviewing a diff by eye, or having another LLM "read" the code and say it looks fine, doesn't catch the failure mode that's unique to AI agents: **gaming the test suite instead of fixing the bug** — deleting a failing assertion, weakening a check, or hardcoding the expected output, so it looks like the job passed when it didn't. Today, that's only caught by a human checking manually — the exact bottleneck autonomous agents are supposed to remove.

## The Solution

CrossCheck is a verification + payment layer for AI coding agents:

1. A **worker agent** receives a bug report and a file with a failing test, and returns a patch.
2. A **reviewer** — deterministic code, not another LLM's opinion — runs the actual test suite against the patch inside an isolated sandbox, and checks a simple anti-cheat rule (test count/assertions must not be removed or weakened; `tests/` is strictly read-only for the worker).
3. If the patch genuinely passes: the verdict is written to the **ERC-8004 Reputation Registry** against the worker's on-chain identity, and payment settles via **x402** — verify first, pay only on real success.
4. If the worker cheated or the patch fails: the verdict is still written on-chain (reputation drops, visibly), and no payment settles.

**Why it's trustworthy, not just another reputation score:** the pass/fail call isn't one AI's opinion of another AI's work — it's a fact anchored to code that actually ran. The only human-authored judgment is a small, transparent, deterministic rule set (not a prompt), and every verdict is permanent and public once written.

## Architecture

```
Bug report + buggy file
        │
        ▼
┌───────────────┐     patch      ┌──────────────────┐    verdict    ┌───────────────┐
│  Worker Agent  │ ─────────────▶ │     Reviewer      │ ─────────────▶│     Chain     │
│  (Gemini API)  │                │  (Docker + Jest)  │                │ (ERC-8004 +   │
└───────────────┘                └──────────────────┘                │    x402)      │
                                          │                            └───────────────┘
                                          ▼                                    │
                                  Locked-down sandbox                          ▼
                                  --network none                    Reputation write +
                                  --read-only                       conditional payment
                                  --cap-drop=ALL                    settlement
                                  --memory=256m
                                          │
                                          ▼
                                  Frontend Dashboard
                                  (live status, reputation score,
                                   verdict history)
```

## Tech Stack

| Layer | Tech |
|---|---|
| Worker agent | Node.js/TypeScript, Gemini API (`gemini-3.5-flash`) |
| Reviewer/sandbox | Node.js/TypeScript + Docker (locked-down container) + Jest |
| Chain calls | `viem` |
| Payments | `@x402/core`, `@x402/next`, `@x402/fetch`, `@x402/evm` |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Wallet | MetaMask (browser) + throwaway server-side signing key |
| Network | Monad Testnet (chain ID `10143`) |

No Solidity, no custom contract deployment — CrossCheck reads and writes to ERC-8004's Identity Registry and Reputation Registry, which are already deployed on Monad testnet.

## Project Structure

```
crosscheck/
├── .env                          # PRIVATE_KEY, MONAD_RPC_URL, GEMINI_API_KEY — never commit
├── docker/
│   ├── Dockerfile                # Node.js + Jest sandbox image
│   └── runner-entrypoint.sh
├── test-cases/
│   ├── clean-bug/                # Genuine bug + passing test
│   └── cheat-bait-bug/           # Bug where the easy LLM shortcut is to cheat
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard UI
│   │   └── api/
│   │       ├── worker/route.ts
│   │       ├── reviewer/route.ts
│   │       └── chain/{reputation,settle}/route.ts
│   ├── lib/
│   │   ├── worker/generatePatch.ts
│   │   ├── reviewer/{runInSandbox,antiCheatRules}.ts
│   │   ├── chain/{viemClient,erc8004,x402Settlement}.ts
│   │   └── shared/types.ts       # Shared TypeScript contract
│   └── components/               # TaskInput, StatusPanel, ReputationScore, VerdictHistory
└── scripts/
    └── checkConnection.ts        # RPC sanity check
```

## Setup

### 1. Prerequisites
- Node.js 20+
- Docker Desktop (running)
- A MetaMask wallet (or any EVM wallet)

### 2. Add Monad Testnet to your wallet
| Field | Value |
|---|---|
| Network Name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency Symbol | MON |

### 3. Fund a throwaway wallet
- Test MON: [faucet.monad.xyz](https://faucet.monad.xyz)
- Test USDC: [faucet.circle.com](https://faucet.circle.com) (select Monad Testnet)

Use a **fresh wallet**, not your main one — its private key will live in a local `.env` file for the code to sign transactions with.

### 4. Environment variables
Create `.env` in `crosscheck/`:
```
PRIVATE_KEY=0xyourthrowawaykey
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
GEMINI_API_KEY=your_gemini_key
```

### 5. Install and build the sandbox image
```bash
cd crosscheck
npm install
docker build -t crosscheck-runner -f docker/Dockerfile docker
```

### 6. Confirm your chain connection
```bash
npx tsx scripts/checkConnection.ts
```
Should print a real (non-error) balance.

### 7. Run it
```bash
npm run dev
```
Open `http://localhost:3000`.

## Running Tests Manually

```bash
# Clean bug — expect passed: true, cheatDetected: false
curl -X POST http://localhost:3000/api/reviewer -H "Content-Type: application/json" -d @test-clean.json

# Patch that doesn't actually fix the bug — expect passed: false
curl -X POST http://localhost:3000/api/reviewer -H "Content-Type: application/json" -d @test-still-broken.json
```

## Sandbox Security

All worker-generated code runs inside a locked-down Docker container — never on bare metal:

```bash
docker run \
  --rm --network none --memory=256m --cpus=0.5 --pids-limit=64 \
  --read-only --tmpfs /tmp --security-opt no-new-privileges \
  --cap-drop=ALL --user 1000:1000 --timeout 30 \
  crosscheck-runner
```

Fresh container per verification. No network access, no persistence, no elevated privileges.

## Known Limitations (V1)

- **Catches test tampering, not hardcoded fixes.** A worker could leave assertions intact but hardcode the expected output instead of fixing the actual logic. V2 would add mutation testing (re-running tests against slightly altered code) to confirm the logic is real.
- **Valid test refactoring is blocked by design.** If a genuine fix requires editing a test, CrossCheck V1 flags it as a cheat — `tests/` is strictly read-only, full stop.
- **The reviewer runs off-chain.** Only the verdict hash and reasoning get written on-chain — the classic off-chain-compute-plus-on-chain-anchor pattern, since running a full test suite on-chain isn't feasible.

## Deployment Note

The Reviewer route depends on a local Docker daemon and cannot run on serverless platforms like Vercel. Frontend, Worker, and Chain routes deploy normally; the Reviewer is run locally (or on a Docker-capable VM) and exposed via a tunnel (e.g. `ngrok http 3000`) if a public URL is required alongside a Vercel-hosted frontend.
