import { NextRequest, NextResponse } from "next/server";
import { runInSandbox } from "../../../lib/reviewer/runInSandbox";
import { verifyAntiCheatRules } from "../../../lib/reviewer/antiCheatRules";
import { ReviewerVerdict } from "../../../lib/shared/types";
import { keccak256, toHex } from "viem";
import * as fs from "fs";
import * as path from "path";

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

    // Resolve paths to the original buggy file and the test file
    const testCasesDir = path.join(process.cwd(), "test-cases");
    const bugDir = path.join(testCasesDir, bugId);

    const originalFilePath = path.join(bugDir, originalFile);
    if (!fs.existsSync(originalFilePath)) {
      return NextResponse.json(
        { error: `Original file not found: ${originalFilePath}` },
        { status: 404 }
      );
    }
    const originalFileContents = fs.readFileSync(originalFilePath, "utf8");

    const testsDir = path.join(bugDir, "tests");
    if (!fs.existsSync(testsDir)) {
      return NextResponse.json(
        { error: `Tests directory not found: ${testsDir}` },
        { status: 404 }
      );
    }

    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith(".test.ts") || f.endsWith(".test.js"));
    if (testFiles.length === 0) {
      return NextResponse.json(
        { error: `No test files found in: ${testsDir}` },
        { status: 404 }
      );
    }

    const testFilePath = path.join(testsDir, testFiles[0]);
    const testFileContents = fs.readFileSync(testFilePath, "utf8");

    // Run in docker sandbox (runs both baseline and patched)
    const sandboxResult = await runInSandbox(workerOutput, originalFileContents, testFileContents);

    // Run anti cheat checks
    const antiCheat = verifyAntiCheatRules(
      workerOutput,
      testFileContents,
      sandboxResult.testCountBefore,
      sandboxResult.testCountAfter,
      sandboxResult.testFileContentsAfter
    );

    let passed = sandboxResult.passed && !antiCheat.cheatDetected;
    let reason = antiCheat.reason;

    if (sandboxResult.error) {
      passed = false;
      reason = sandboxResult.error;
    }

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
