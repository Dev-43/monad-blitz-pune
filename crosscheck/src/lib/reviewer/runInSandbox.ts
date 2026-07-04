import { WorkerOutput } from "../shared/types";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface SandboxResult {
  rawStdout: string;
  testCountBefore: number;
  testCountAfter: number;
  passed: boolean;
  testFileContentsAfter?: string;
  error?: string;
}

interface TestRunResult {
  testCount: number;
  passed: boolean;
  rawStdout: string;
  testFileContentsAfter?: string;
  error?: string;
}

/**
 * Runs a single test execution inside the Docker sandbox.
 */
async function runTestRun(
  originalFileName: string,
  fileContents: string,
  testFileContents: string
): Promise<TestRunResult> {
  const sandboxDir = path.resolve(process.cwd(), "tmp-sandbox");
  if (!fs.existsSync(sandboxDir)) {
    fs.mkdirSync(sandboxDir, { recursive: true });
  }

  const runId = Math.random().toString(36).substring(2, 15);
  const runDir = path.join(sandboxDir, `run-${runId}`);
  const testsDir = path.join(runDir, "tests");
  let testFileContentsAfter = "";

  fs.mkdirSync(testsDir, { recursive: true });

  // Write buggy/patched file
  fs.writeFileSync(path.join(runDir, originalFileName), fileContents, "utf8");
  // Write test file
  fs.writeFileSync(path.join(testsDir, "buggy.test.ts"), testFileContents, "utf8");

  try {
    const absoluteRunDir = path.resolve(runDir);
    
    // Construct Docker run command with exact security flags from project brief
    const dockerCmd = [
      "docker",
      "run",
      "--rm",
      "--network none",
      "--memory=256m",
      "--cpus=0.5",
      "--pids-limit=64",
      "--read-only",
      "--tmpfs /tmp",
      "--security-opt no-new-privileges",
      "--cap-drop=ALL",
      "--user 1000:1000",
      `-v "${absoluteRunDir}:/app/workspace"`,
      "crosscheck-runner:latest"
    ].join(" ");

    let stdout = "";
    let stderr = "";
    try {
      const result = await execAsync(dockerCmd, { timeout: 30000 });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execErr: any) {
      stdout = execErr.stdout || "";
      stderr = execErr.stderr || "";
      if (!stdout && stderr) {
        console.error("[Reviewer Sandbox] Docker exec failed. Stderr:", stderr);
        return {
          testCount: 0,
          passed: false,
          rawStdout: stdout,
          testFileContentsAfter,
          error: `Docker execution failed: ${stderr.trim()}`
        };
      }
    }

    // Read test file back from host to check if it was modified
    const testFilePathAfter = path.join(testsDir, "buggy.test.ts");
    if (fs.existsSync(testFilePathAfter)) {
      testFileContentsAfter = fs.readFileSync(testFilePathAfter, "utf8");
    }

    let testCount = 0;
    let passed = false;
    try {
      const parsed = JSON.parse(stdout.trim());
      testCount = parsed.numTotalTests || 0;
      passed = parsed.success || false;
    } catch (parseErr) {
      return {
        testCount: 0,
        passed: false,
        rawStdout: stdout,
        testFileContentsAfter,
        error: stdout.includes("Security Error") 
          ? stdout.trim() 
          : `Failed to parse Jest output: ${stdout.trim()}`
      };
    }

    return {
      testCount,
      passed,
      rawStdout: stdout,
      testFileContentsAfter
    };

  } catch (err: any) {
    return {
      testCount: 0,
      passed: false,
      rawStdout: "",
      error: err.message || "Docker execution failed"
    };
  } finally {
    // Clean up temp run directory
    try {
      fs.rmSync(runDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.error("[Reviewer Sandbox] Cleanup error:", cleanupErr);
    }
  }
}

/**
 * Runs the patched code inside an isolated Docker sandbox container.
 * Enforces the strict resource and security constraints from the brief.
 */
export async function runInSandbox(
  workerOutput: WorkerOutput,
  originalFileContents: string,
  testFileContents: string
): Promise<SandboxResult> {
  console.log(`[Reviewer Sandbox] Running baseline and patched tests for ${workerOutput.bugId}...`);

  // Run 1: Baseline (using original unpatched file contents)
  const baselineResult = await runTestRun(
    workerOutput.originalFile,
    originalFileContents,
    testFileContents
  );

  if (baselineResult.error && baselineResult.error.includes("Security Error")) {
    return {
      rawStdout: baselineResult.rawStdout,
      testCountBefore: 0,
      testCountAfter: 0,
      passed: false,
      error: baselineResult.error
    };
  }

  // Run 2: Patched (using worker patched file contents)
  const patchedResult = await runTestRun(
    workerOutput.originalFile,
    workerOutput.patchedFile,
    testFileContents
  );

  return {
    rawStdout: patchedResult.rawStdout,
    testCountBefore: baselineResult.testCount,
    testCountAfter: patchedResult.testCount,
    passed: patchedResult.passed,
    testFileContentsAfter: patchedResult.testFileContentsAfter,
    error: patchedResult.error
  };
}