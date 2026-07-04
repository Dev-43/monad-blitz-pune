"use client";

import React, { useState } from "react";
import { TaskInput } from "../components/TaskInput";
import { StatusPanel, StepStatus } from "../components/StatusPanel";
import { ReputationScore } from "../components/ReputationScore";
import { VerdictHistory } from "../components/VerdictHistory";
import { ReviewerVerdict } from "../lib/shared/types";

export default function Dashboard() {
  const [bugId, setBugId] = useState<string>("clean-bug");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reputationScore, setReputationScore] = useState<number>(87);
  const [workerStatus, setWorkerStatus] = useState<StepStatus>("idle");
  const [reviewerStatus, setReviewerStatus] = useState<StepStatus>("idle");
  const [chainStatus, setChainStatus] = useState<StepStatus>("idle");

  const [diffSummary, setDiffSummary] = useState<string>("");
  const [verdictReason, setVerdictReason] = useState<string>("");
  const [settlementTx, setSettlementTx] = useState<string>("");

  const [verdicts, setVerdicts] = useState<ReviewerVerdict[]>([
    {
      agentId: "0x3F1A...D89b",
      bugId: "clean-bug",
      passed: true,
      cheatDetected: false,
      reason: "all tests passed, test file untouched, assertion count unchanged",
      testCountBefore: 4,
      testCountAfter: 4,
      verdictHash: "0x7a8e2f9d1b0c3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2e3f4c5b6a7f8e",
      timestamp: 1735900000,
    },
  ]);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setWorkerStatus("running");
    setReviewerStatus("idle");
    setChainStatus("idle");
    setDiffSummary("Worker analyzing repository and applying patch...");
    setVerdictReason("");
    setSettlementTx("");

    // Simulate pipeline step 1: Worker Agent
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setWorkerStatus("success");
    setDiffSummary(
      bugId === "clean-bug"
        ? "Fixed numeric comparator: [...arr].sort((a,b)=>a-b)"
        : "Hardcoded outputs returning correct results for tests"
    );

    // Simulate pipeline step 2: Reviewer Sandbox
    setReviewerStatus("running");
    setVerdictReason("Initializing Docker container & executing tests...");
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const isClean = bugId === "clean-bug";
    if (isClean) {
      setReviewerStatus("success");
      setVerdictReason("All 4/4 tests passed. Anti-cheat rules verified successfully.");
    } else {
      setReviewerStatus("cheated");
      setVerdictReason("TAMPER DETECTED: Hardcoded test cases match inputs specifically. Failing anti-cheat verification.");
    }

    // Simulate pipeline step 3: Chain Registry & Settlement
    setChainStatus("running");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const verdictHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}` as `0x${string}`;

    const newVerdict: ReviewerVerdict = {
      agentId: "0x3F1A...D89b",
      bugId,
      passed: isClean,
      cheatDetected: !isClean,
      reason: isClean
        ? "all tests passed, test file untouched, assertion count unchanged"
        : "TAMPER DETECTED: Hardcoded inputs matched test runner environment",
      testCountBefore: 4,
      testCountAfter: isClean ? 4 : 3,
      verdictHash,
      timestamp: Date.now(),
    };

    setVerdicts((prev) => [newVerdict, ...prev]);

    if (isClean) {
      setChainStatus("success");
      setReputationScore((prev) => Math.min(prev + 5, 100));
      setSettlementTx("0x4faec10398f828ef05b4a921dcdfe88470bc55e2d1920acbe09e2ff9d71c8901");
    } else {
      setChainStatus("failed");
      setReputationScore((prev) => Math.max(prev - 15, 0));
      setSettlementTx("");
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            CrossCheck
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-2">
            Verifiable off-chain computing with automated ERC-8004 identity & reputation settlement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Network: Monad Testnet
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            x402 Facilitator Active
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Controls & Identity */}
        <div className="lg:col-span-4 space-y-8">
          <TaskInput
            currentBugId={bugId}
            onSelectBug={setBugId}
            isLoading={isLoading}
            onStartVerification={handleStartVerification}
          />
          <ReputationScore score={reputationScore} agentAddress="0x3F1AD7B912349e5678cdfe9ba88470bc55e2d89b" />
        </div>

        {/* Middle Column - Pipeline Status */}
        <div className="lg:col-span-4">
          <StatusPanel
            workerStatus={workerStatus}
            reviewerStatus={reviewerStatus}
            chainStatus={chainStatus}
            diffSummary={diffSummary}
            verdictReason={verdictReason}
            txHash={settlementTx}
          />
        </div>

        {/* Right Column - Verdict Log */}
        <div className="lg:col-span-4">
          <VerdictHistory verdicts={verdicts} />
        </div>
      </div>
    </div>
  );
}
