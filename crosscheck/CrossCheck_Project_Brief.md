# CrossCheck — Project Brief

*Monad Blitz Pune V2 — 4-hour build, 2 teammates, built with Google Antigravity*

---

## 1. One-sentence pitch

> An independent reviewer agent catches when a coding agent cuts corners on a bug fix — by actually running the tests, not reading the diff — and writes the verdict on-chain so trust and payment move together, automatically.

## 2. The problem

AI coding agents are now routinely hired to fix bugs autonomously, but there's no reliable way to know if a fix actually works before paying for it or trusting the agent again. Reviewing a diff by eye, or having another LLM "read" the code and say it looks fine, doesn't catch the failure mode that's unique to AI agents: **gaming the test suite instead of fixing the bug** — deleting a failing assertion, weakening a check, or hardcoding the expected output, so it looks like the job passed when it didn't. Today that's only caught by a human checking manually — the exact bottleneck autonomous agents are supposed to remove.

## 3. The solution

CrossCheck is a verification + payment layer for AI coding agents:

1. A **worker agent** receives a bug report + a file with a failing test, and returns a patch.
2. A **reviewer** — deterministic code, not another LLM's opinion — runs the actual test suite against the patch inside an isolated sandbox, and checks a simple anti-cheat rule (test count/assertions must not be removed or weakened; `tests/` is strictly read-only for the worker).
3. If the patch genuinely passes: the verdict is written to the **ERC-8004 Reputation Registry** against the worker's on-chain identity, and payment settles via **x402** — verify first, pay only on real success.
4. If the worker cheated or the patch fails: the verdict is still written on-chain (reputation drops, visibly), and no payment settles.

**Why it's trustworthy, not just another reputation score:** the pass/fail call isn't one AI's opinion of another AI's work — it's a fact anchored to code that actually ran. The only human-authored judgment is a small, transparent, deterministic rule set (not a prompt), and every verdict is permanent and public once written.

**What's genuinely new:** not test-driven verification or conditional payment individually (both exist already) — it's wiring them together specifically to catch the AI-specific failure mode of gaming its own tests, and tying that verdict directly to both an agent's permanent public identity and its payment.

## 3.5 Tech stack — locked in

Everything runs on one language across the whole project: **Node.js + TypeScript**, with Next.js as the single app framework for both the API routes and the dashboard. No Python, no Solidity, no separate backend framework. One stack means Person A and Person B can read each other's code without context-switching, and Antigravity agents share consistent conventions across all four pieces.

| Piece | Tech |
|---|---|
| Worker agent | Node.js/TypeScript, called from a Next.js API route, using the Anthropic or Gemini SDK |
| Reviewer/sandbox | Node.js/TypeScript service that shells out to Docker; test runner inside the container is **Jest** |
| Chain calls | **viem** (lighter and more modern than ethers.js/web3.py for this use case) |
| Payments | `@x402/core`, `@x402/next`, `@x402/fetch`, `@x402/evm` |
| Frontend | Next.js (App Router) + TypeScript + Tailwind |
| Wallet | MetaMask (browser) + a throwaway wallet's private key in `.env` for server-side signing |

Why viem over ethers.js/web3.py here: it's TypeScript-native, has first-class Next.js/wagmi integration, and is what the Monad starter kits and MonSkills tooling are built around — less friction pulling in docs and examples mid-hackathon.

## 3.6 File structure

A single Next.js app with everything as API routes keeps this simple enough for 4 hours — no need for a multi-package monorepo.

```
crosscheck/
├── .env                          # PRIVATE_KEY, MONAD_RPC_URL, ANTHROPIC_API_KEY — never commit
├── .env.example                  # same keys, no real values, safe to commit
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── docker/
│   ├── Dockerfile                # Node.js + Jest, used by the reviewer to run patched code
│   └── runner-entrypoint.sh      # copies patch in, runs jest, prints JSON result to stdout
├── test-cases/
│   ├── clean-bug/
│   │   ├── buggy.ts              # the genuinely broken function
│   │   ├── bugReport.txt         # plain-text description of the bug
│   │   └── tests/
│   │       └── buggy.test.ts     # the test that currently fails
│   └── cheat-bait-bug/
│       ├── buggy.ts
│       ├── bugReport.txt
│       └── tests/
│           └── buggy.test.ts
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── page.tsx                      # dashboard UI (Person B)
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── worker/route.ts           # POST: bug in → patch out (Person A)
│   │       ├── reviewer/route.ts         # POST: patch in → verdict out (Person A)
│   │       ├── chain/reputation/route.ts # POST: verdict in → reputation tx out (Person B)
│   │       └── chain/settle/route.ts     # POST: verdict in → x402 verify+settle out (Person B)
│   ├── lib/
│   │   ├── worker/
│   │   │   └── generatePatch.ts          # LLM call logic (Person A)
│   │   ├── reviewer/
│   │   │   ├── runInSandbox.ts           # docker run with the locked-down flags (Person A)
│   │   │   └── antiCheatRules.ts         # test count / assertion / read-only checks (Person A)
│   │   ├── chain/
│   │   │   ├── viemClient.ts             # shared viem public/wallet client setup (Person B)
│   │   │   ├── erc8004.ts                # Identity + Reputation Registry calls (Person B)
│   │   │   └── x402Settlement.ts         # verify/settle calls to the facilitator (Person B)
│   │   └── shared/
│   │       └── types.ts                  # the JSON contract from section 7, as shared TS types
│   └── components/
│       ├── TaskInput.tsx                 # (Person B)
│       ├── StatusPanel.tsx               # Worker → Reviewer → Chain progress (Person B)
│       ├── ReputationScore.tsx           # (Person B)
│       └── VerdictHistory.tsx            # pass/fail log (Person B)
└── scripts/
    └── checkConnection.ts                # the 10-minute balance-read sanity check from section 5.4
```

Key idea: `src/lib/shared/types.ts` holds the JSON contract as actual TypeScript interfaces (`WorkerOutput`, `ReviewerVerdict`, `ChainResult`) — both people import from this one file, so the "shared contract" from section 7 becomes enforced by the compiler, not just a doc you have to remember to follow.


- **V1 catches test tampering, not hardcoded fixes.** A worker could leave assertions intact but hardcode the expected output (`if input == [3,1,2]: return [1,2,3]`). V1 does not catch this. V2 would add mutation testing (re-running tests against slightly altered code) to confirm the logic is real, not hardcoded.
- **Valid test refactoring is blocked by design.** If a bug fix legitimately requires editing a test, CrossCheck V1 will flag it as a cheat. The MVP boundary is strict: `tests/` is read-only, full stop.
- **The reviewer runs off-chain** (blockchain is too slow/expensive for live test execution). Only the verdict hash + reasoning gets written on-chain — the classic off-chain-compute-plus-on-chain-anchor pattern.

## 4.5 Do we even need to deploy our own smart contract?

**No — and that's a good thing for a 4-hour build.** ERC-8004's Identity Registry and Reputation Registry are already deployed on Monad testnet by the standard's maintainers. You are not writing or deploying Solidity — you are calling existing contracts:

- **Identity Registry** — you register (or use a pre-registered) agent identity for your worker agent. This gives it an on-chain address/ID.
- **Reputation Registry** — you *write* feedback entries to it (a normal contract call, no deployment).

The only "deployment-shaped" work in this project is registering your worker agent's identity once at the start — a single transaction, not a contract deployment. If your team wants a stretch-goal custom contract later (e.g. a tiny escrow), that's optional and separate — the core project does not require it. Confirm this by reading `docs.monad.xyz/guides/erc-8004` for the current testnet registry addresses before you start (addresses can change between doc versions, so pull them fresh rather than guessing).

## 5. Environment setup — do this first, together, before splitting up

### 5.1 Set up your wallet for Monad testnet
You already have a MON wallet (e.g. MetaMask or another EVM wallet) — you just need to point it at Monad's testnet, which it doesn't know about by default.

1. Open your wallet → **Add Network** → **Add a network manually** (in MetaMask: Settings → Networks → Add Network).
2. Enter these exact values:
   - **Network Name:** Monad Testnet
   - **RPC URL:** `https://testnet-rpc.monad.xyz`
   - **Chain ID:** `10143`
   - **Currency Symbol:** MON
   - **Block Explorer URL:** check `docs.monad.xyz` for the current testnet explorer link
3. Save, then switch your wallet to this new network. You should see a `0` MON balance — that's expected, you haven't funded it yet.

### 5.2 Fund your wallet with test tokens (all free)
- **Test MON** (for gas fees): go to `https://faucet.monad.xyz`, paste your wallet address, request funds.
- **Test USDC** (for the x402 payment flow): go to `https://faucet.circle.com`, select "Monad Testnet," paste your wallet address, request funds.
- Wait a minute, then refresh your wallet — you should see both balances appear. If nothing arrives after a few minutes, double-check you're on the testnet network (chain ID 10143) in your wallet, not mainnet.

### 5.3 Get your private key for the code to use (careful with this)
Your Antigravity agents will need a private key to sign transactions programmatically (separate from your wallet's UI). **Use a fresh throwaway wallet for this, not your main one:**
1. Create a brand-new wallet account (in MetaMask: Account menu → Add account) specifically for this hackathon.
2. Fund *that* new address using the same two faucets above.
3. Export its private key (MetaMask: Account details → Export private key) and store it in a local `.env` file — **never commit this to git, never paste it in chat, never share your screen with it visible.**
4. Your `.env` file should have: `PRIVATE_KEY=0xyourkey`, `MONAD_RPC_URL=https://testnet-rpc.monad.xyz`.

### 5.4 Confirm the connection works before building anything else
Before writing any project logic, get one trivial script working that reads a test balance back from the chain, using `viem`:

```javascript
import { createPublicClient, http } from "viem";

const client = createPublicClient({
  transport: http("https://testnet-rpc.monad.xyz"),
});

const balance = await client.getBalance({ address: "0xYourAddress" });
console.log("Balance:", balance.toString());
```

If this prints a non-zero number, your chain connection is confirmed working — do this 10-minute check first, so you're not debugging chain plumbing and project logic at the same time later.

### 5.5 Docker quick-start (installed but unused so far)
You don't need to learn Docker deeply — you need exactly one workflow: build one small image, then run untrusted code inside it repeatedly.

1. Confirm Docker works: run `docker --version` and `docker run hello-world` in your terminal.
2. Write one minimal `Dockerfile` for the reviewer's runtime (Node.js + Jest, matching the locked-in stack):
   ```dockerfile
   FROM node:20-slim
   WORKDIR /app
   COPY . /app
   RUN npm install --production
   CMD ["npx", "jest", "tests/", "--json"]
   ```
3. Build it once: `docker build -t crosscheck-runner -f docker/Dockerfile .`
4. Run it with the locked-down flags from section 6 below, each time you need to test a patch — rebuild the image only if the base runtime changes, but run a fresh container every single verification.
5. That's the entire Docker workflow for this project: **one build, many isolated runs.**

## 6. Security: sandboxing untrusted agent output

All worker-generated code is treated like potential malware and executed only inside a locked-down Docker container — never on bare metal, never on a teammate's laptop filesystem directly.

```bash
docker run \
  --rm \
  --network none \
  --memory=256m \
  --cpus=0.5 \
  --pids-limit=64 \
  --read-only \
  --tmpfs /tmp \
  --security-opt no-new-privileges \
  --cap-drop=ALL \
  --user 1000:1000 \
  --timeout 30 \
  crosscheck-runner:latest
```

- `--network none` — no exfiltration, no phoning home.
- `--memory` / `--cpus` / `--pids-limit` — kills fork bombs / infinite loops.
- `--read-only` + `--tmpfs /tmp` — nothing persists or spreads.
- `--cap-drop=ALL` + non-root user — no privileged damage even if compromised.
- Hard wall-clock timeout — safety net for anything else.

Run **per-task, fresh container every time** — no shared state between runs.

## 7. Shared JSON contract (agree on this before splitting up work)

*(This lives as actual TypeScript interfaces in `src/lib/shared/types.ts` — see file structure section 3.6 — so both people import from one file instead of copy-pasting JSON shapes.)*

```json
// Worker output → Reviewer input
{
  "agentId": "0xWORKER_ADDRESS",
  "bugId": "bug-001",
  "originalFile": "sort.py",
  "patchedFile": "<full patched file contents>",
  "diffSummary": "one-line description of the change"
}

// Reviewer output → Chain + Frontend input
{
  "agentId": "0xWORKER_ADDRESS",
  "bugId": "bug-001",
  "passed": true,
  "cheatDetected": false,
  "reason": "all tests passed, test file untouched, assertion count unchanged",
  "testCountBefore": 4,
  "testCountAfter": 4,
  "verdictHash": "0x...",
  "timestamp": 1735900000
}

// Chain output → Frontend input
{
  "agentId": "0xWORKER_ADDRESS",
  "reputationTxHash": "0x...",
  "paymentSettled": true,
  "settlementTxHash": "0x... or null",
  "newReputationScore": 87
}
```

## 8. Test cases to hand-write (do NOT delegate this part)

- **Clean bug:** a genuinely buggy function (e.g. broken sort/comparator) + one passing test file that correctly detects the bug. The worker should be able to fix it legitimately.
- **Cheat-bait bug:** a bug where the easiest LLM shortcut is to weaken/delete the test or hardcode the output rather than fix the actual logic. This is your demo's money-shot failure case.

## 9. Team split — who runs which Antigravity prompt, and in what order

| Person | Owns | Antigravity prompts to run (in order) |
|---|---|---|
| **Person A** | Worker agent + Reviewer/sandbox | 1st: **Worker agent prompt**. 2nd: **Reviewer/sandbox prompt** (needs Docker set up first — see section 5.5) |
| **Person B** | Chain (ERC-8004 + x402) + Frontend | 1st: **Chain agent prompt** (needs wallet/env setup from section 5 done first). 2nd: **Frontend agent prompt** (can start with mocked data immediately, doesn't need to wait on Person A) |

Practical note: Person B's Frontend prompt has no dependency on anyone else finishing, so it's the safest one to start first if you want to get an agent running immediately while the other setup steps (wallet, faucet, Docker) finish in parallel.

## 10. 4-hour timeline

| Time | Task |
|---|---|
| 0:00–0:20 | Setup: testnet MON, x402 test USDC, ERC-8004 addresses from `docs.monad.xyz/guides/erc-8004`. Agree on JSON contract above. Hand-write the two bug files. |
| 0:20–2:00 | Parallel build. Person A dispatches Antigravity agents for Worker + Reviewer/sandbox. Person B dispatches agents for Chain + Frontend (mocked data first). Check in every 20–30 min via Antigravity Walkthroughs. |
| 2:00–2:45 | Integration: wire all four pieces together using the shared JSON contract. |
| 2:45–3:15 | Run the cheat-bait bug through the full pipeline live; confirm it's caught, reputation drops, no settlement. |
| 3:15–3:45 | Rehearse the full demo twice: clean run, then cheat run. Lock the opening one-liner and the sandbox-security line. |

## 11. Antigravity task-brief prompts (paste one per agent workspace)

**→ Person A runs this first: Worker agent**
```
In this Next.js + TypeScript project (structure: see file-structure section), build the Worker agent:
1. Create src/lib/worker/generatePatch.ts: accepts { bugId, buggyFileContents, bugReportText }, calls the Claude API asking it to return ONLY the corrected full file contents as a patch.
2. Create src/app/api/worker/route.ts: a POST route that calls generatePatch.ts and returns JSON matching the WorkerOutput type in src/lib/shared/types.ts: { agentId, bugId, originalFile, patchedFile, diffSummary }
No UI needed — this is called by the Reviewer route.
```

**→ Person A runs this second: Reviewer/sandbox**
```
In this Next.js + TypeScript project, build the Reviewer:
1. Create src/lib/reviewer/runInSandbox.ts: writes patchedFile into a mounted volume, then runs it inside a Docker container (image built from docker/Dockerfile, Node.js + Jest) using these exact flags: --rm --network none --memory=256m --cpus=0.5 --pids-limit=64 --read-only --tmpfs /tmp --security-opt no-new-privileges --cap-drop=ALL --user 1000:1000, hard 30-second timeout.
2. Create src/lib/reviewer/antiCheatRules.ts: the tests/ directory must be strictly read-only — if the patch touches anything in tests/, immediately fail with cheatDetected: true. Also compare test count and assertion count before/after; if either decreased, fail with cheatDetected: true.
3. Create src/app/api/reviewer/route.ts: a POST route accepting WorkerOutput, returning JSON matching the ReviewerVerdict type in src/lib/shared/types.ts: { agentId, bugId, passed, cheatDetected, reason, testCountBefore, testCountAfter, verdictHash, timestamp }
```

**→ Person B runs this first: Chain**
```
In this Next.js + TypeScript project, build the Chain layer using viem:
1. Create src/lib/chain/viemClient.ts: a shared viem public client + wallet client, reading PRIVATE_KEY and MONAD_RPC_URL from .env, targeting Monad testnet (chain ID 10143, RPC https://testnet-rpc.monad.xyz).
2. Create src/lib/chain/erc8004.ts: a function that writes a feedback entry to the ERC-8004 Reputation Registry (address + ABI from docs.monad.xyz/guides/erc-8004), tied to agentId, recording passed/cheatDetected/verdictHash.
3. Create src/lib/chain/x402Settlement.ts: calls x402 /verify then /settle against https://x402-facilitator.molandak.org, using the @x402/core, @x402/next, @x402/fetch, @x402/evm packages.
4. Create src/app/api/chain/reputation/route.ts and src/app/api/chain/settle/route.ts: POST routes accepting a ReviewerVerdict, calling the above, and returning JSON matching the ChainResult type in src/lib/shared/types.ts: { agentId, reputationTxHash, paymentSettled, settlementTxHash, newReputationScore }. If passed is false or cheatDetected is true, skip the settle call entirely.
```

**→ Person B runs this second (or first, if starting immediately with mocked data): Frontend**
```
In this Next.js + TypeScript + Tailwind project, build the dashboard at src/app/page.tsx using these components (all in src/components/):
1. TaskInput.tsx — shows the current bug being processed.
2. StatusPanel.tsx — shows Worker → Reviewer → Chain progress live.
3. ReputationScore.tsx — the worker agent's current on-chain reputation score.
4. VerdictHistory.tsx — a log of past verdicts with reason text.
Start with mocked data matching the WorkerOutput/ReviewerVerdict/ChainResult types in src/lib/shared/types.ts, then wire to the real API routes (/api/worker, /api/reviewer, /api/chain/reputation, /api/chain/settle) once they're ready.

Apply this exact design system throughout — do not default to a generic Tailwind/shadcn look:

DESIGN SYSTEM — "editorial tech journal on warm parchment"
- Page background: Parchment #f6f3f1 — NEVER pure white (#ffffff).
- Headings (StatusPanel titles, ReputationScore label, section headers): Untitled Serif (fallback: Georgia/Times New Roman), weight 400 ONLY — never bold. Sizes: 24px for card titles, 40-48px for the main dashboard title.
- ALL body text, buttons, badges, nav, status labels, verdict reasons, numbers: ABC Diatype Mono (fallback: JetBrains Mono / IBM Plex Mono), uppercase for labels/badges/buttons with tight letter-spacing (-0.02em to -0.03em).
- Accent color: Lake Blue #2b59d1 — reserve this ONLY for the single primary action on screen (e.g. "Run Task" button). Everything else stays in warm grayscale: Off-Black #242424 (primary text, secondary buttons), Graphite #4e4d4d (body text), Smoke #797776 (helper text), Ash #cecac8 (all borders/dividers, 1px solid only).
- Cards (StatusPanel, ReputationScore, VerdictHistory entries): Parchment or transparent fill, 1px solid Ash border, 40px border-radius, 40px padding. NO drop shadows — use border + surface contrast only.
- One elevated exception: give ReputationScore card a Periwinkle Mist #cfdaf5 fill (the one colored surface in the system) to make the live-updating number the visual focal point of the dashboard.
- Buttons: 100px border-radius (pill), 16px 32px padding, uppercase mono text. Primary action = Lake Blue fill + white text. Secondary = Off-Black fill + white text. Tertiary/ghost = transparent + 1px Off-Black border + Off-Black text.
- Status indicators in StatusPanel (Worker → Reviewer → Chain progress): use small pill-shaped tags (9999px radius), Parchment fill, 1px Ash border, 12px mono uppercase text — matching a "pipeline node" pattern, connected by thin Ash lines to visually show the pipeline flow.
- Verdict history entries (pass vs cheat-detected vs fail): differentiate using text color only (not background fills) — e.g. Off-Black for pass, Crimson #f37a0a or Coral #ff9473 for cheat-detected/fail — keep borders and card fill consistent Parchment/Ash throughout.
- Never introduce shadows, gradients on functional UI elements, sans-serif headings, or corner radii below 16px on cards / below 100px on buttons.
```

## 12. Demo script (rehearse this exact flow)

1. Open with the one-sentence pitch (section 1).
2. Run the clean bug: show Worker patch → Reviewer runs tests live → passes → reputation ticks up on-chain → payment settles.
3. Run the cheat-bait bug: show Worker takes the shortcut → Reviewer catches it (test file touched / assertions weakened) → reputation drops → no payment.
4. Close with the sandbox line: "All untrusted agent code runs inside a locked-down, network-disabled, resource-capped Docker container — because that's exactly what autonomous agent output is."
5. If pushed on novelty: "We didn't invent CI or invent conditional payments — we're the first to wire them together specifically to catch the failure mode unique to AI agents: gaming their own tests."