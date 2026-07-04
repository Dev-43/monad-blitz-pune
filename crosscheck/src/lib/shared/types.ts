/**
 * Shared JSON contract types between Worker, Reviewer, Chain, and Frontend.
 * These types enforce consistency across all API routes and library code.
 */

// Worker output → Reviewer input
export interface WorkerOutput {
  agentId: `0x${string}`;
  bugId: string;
  originalFile: string;
  patchedFile: string;
  diffSummary: string;
}

// Reviewer output → Chain + Frontend input
export interface ReviewerVerdict {
  agentId: `0x${string}`;
  bugId: string;
  passed: boolean;
  cheatDetected: boolean;
  reason: string;
  testCountBefore: number;
  testCountAfter: number;
  verdictHash: `0x${string}`;
  timestamp: number;
}

// Chain output → Frontend input
export interface ChainResult {
  agentId: `0x${string}`;
  reputationTxHash: `0x${string}`;
  paymentSettled: boolean;
  settlementTxHash: `0x${string}` | null;
  newReputationScore: number;
}
