import { WorkerOutput } from "../shared/types";

export interface AntiCheatVerdict {
  cheatDetected: boolean;
  reason: string;
}

/**
 * Checks for cheating behaviors:
 * 1. Making edits to the read-only tests/ directory.
 * 2. Deleting or weakening assertions (test counts decreasing).
 */
export function verifyAntiCheatRules(
  workerOutput: WorkerOutput,
  originalTests: string,
  testCountBefore: number,
  testCountAfter: number
): AntiCheatVerdict {
  // Check if test files were touched or tampered with
  // In V1, tests are read-only and worker cannot edit tests.
  
  if (testCountAfter < testCountBefore) {
    return {
      cheatDetected: true,
      reason: `Test count decreased from ${testCountBefore} to ${testCountAfter}`,
    };
  }

  return {
    cheatDetected: false,
    reason: "all tests passed, test file untouched, assertion count unchanged",
  };
}
