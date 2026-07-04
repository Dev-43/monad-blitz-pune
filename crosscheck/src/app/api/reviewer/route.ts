import { NextRequest, NextResponse } from "next/server";
import { runInSandbox } from "../../../lib/reviewer/runInSandbox";
import { verifyAntiCheatRules } from "../../../lib/reviewer/antiCheatRules";
import { ReviewerVerdict } from "../../../lib/shared/types";
import { keccak256, toHex } from "viem";

export async function POST(req: NextRequest) {
  try {
    const workerOutput = await req.json();
    const { agentId, bugId, originalFile, patchedFile, diffSummary } = workerOutput;

    if (!agentId || !bugId || !originalFile || !patchedFile) {
      return NextResponse.json(
        { error: "Invalid WorkerOutput payload" },
        { status: 400 }
      );
    }

    // Run in docker sandbox
    const sandboxResult = await runInSandbox(workerOutput, "");

    // Run anti cheat checks
    const antiCheat = verifyAntiCheatRules(
      workerOutput,
      "",
      sandboxResult.testCountBefore,
      sandboxResult.testCountAfter
    );

    const passed = sandboxResult.passed && !antiCheat.cheatDetected;
    const reason = antiCheat.reason;

    // Construct a verdict hash representing this run
    const payloadStr = JSON.stringify({ agentId, bugId, passed, reason });
    const verdictHash = keccak256(toHex(payloadStr));

    const verdict: ReviewerVerdict = {
      agentId,
      bugId,
      passed,
      cheatDetected: antiCheat.cheatDetected,
      reason,
      testCountBefore: sandboxResult.testCountBefore,
      testCountAfter: sandboxResult.testCountAfter,
      verdictHash,
      timestamp: Date.now(),
    };

    return NextResponse.json(verdict);
  } catch (error: any) {
    console.error("[API Reviewer] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
