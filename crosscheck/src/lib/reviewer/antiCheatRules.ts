import { WorkerOutput } from "../shared/types";

export interface AntiCheatVerdict {
  cheatDetected: boolean;
  reason: string;
}

/**
 * Checks for cheating behaviors:
 * 1. Making edits to the read-only tests/ directory.
 * 2. Deleting or weakening assertions (test counts or expectation counts decreasing).
 */
export function verifyAntiCheatRules(
  workerOutput: WorkerOutput,
  originalTests: string,
  testCountBefore: number,
  testCountAfter: number,
  patchedTests?: string
): AntiCheatVerdict {
  // Check if test file was touched or tampered with
  if (patchedTests !== undefined && patchedTests !== originalTests) {
    return {
      cheatDetected: true,
      reason: "tests/ directory was modified",
    };
  }

  // Count assertions (expect) in original vs patched tests
  const countAssertions = (content: string) => {
    return (content.match(/\bexpect\s*\(/g) || []).length;
  };

  const countTests = (content: string) => {
    return (content.match(/\b(it|test)\s*\(/g) || []).length;
  };

  const originalAssertionCount = countAssertions(originalTests);
  const patchedAssertionCount = countAssertions(patchedTests || originalTests);

  const originalTestFileCount = countTests(originalTests);
  const patchedTestFileCount = countTests(patchedTests || originalTests);

  // 1. Check if Jest test counts decreased
  if (testCountAfter < testCountBefore) {
    return {
      cheatDetected: true,
      reason: `Test count decreased from ${testCountBefore} to ${testCountAfter}`,
    };
  }

  // 2. Check if test block counts in file decreased
  if (patchedTestFileCount < originalTestFileCount) {
    return {
      cheatDetected: true,
      reason: `Test blocks count in test file decreased from ${originalTestFileCount} to ${patchedTestFileCount}`,
    };
  }

  // 3. Check if expect() calls count decreased
  if (patchedAssertionCount < originalAssertionCount) {
    return {
      cheatDetected: true,
      reason: `Assertion count decreased from ${originalAssertionCount} to ${patchedAssertionCount}`,
    };
  }

  return {
    cheatDetected: false,
    reason: "all tests passed, test file untouched, assertion count unchanged",
  };
}
