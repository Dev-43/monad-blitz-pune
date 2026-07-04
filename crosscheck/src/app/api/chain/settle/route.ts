import { NextRequest, NextResponse } from "next/server";
import { settleX402Payment } from "@/lib/chain/x402Settlement";
import { writeReputationFeedback } from "@/lib/chain/erc8004";
import { ChainResult, ReviewerVerdict } from "@/lib/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let verdict: ReviewerVerdict;
    let reputationTxHash: `0x${string}` | null = null;
    let newReputationScore: number = 50;

    // Handle both direct ReviewerVerdict or wrapped { verdict, reputationResult }
    if (body.verdict) {
      verdict = body.verdict;
      if (body.reputationResult) {
        reputationTxHash = body.reputationResult.reputationTxHash;
        newReputationScore = body.reputationResult.newReputationScore;
      }
    } else {
      verdict = body;
    }

    if (!verdict || !verdict.agentId) {
      return NextResponse.json(
        { error: "Invalid payload: agentId is required" },
        { status: 400 }
      );
    }

    // Write reputation feedback if it hasn't been written already
    if (!reputationTxHash) {
      const rep = await writeReputationFeedback(verdict);
      reputationTxHash = rep.txHash;
      newReputationScore = rep.newScore;
    }

    let paymentSettled = false;
    let settlementTxHash: `0x${string}` | null = null;

    // If passed is false or cheatDetected is true, skip the settle call entirely
    if (verdict.passed && !verdict.cheatDetected) {
      const settlement = await settleX402Payment(verdict);
      paymentSettled = settlement.paymentSettled;
      settlementTxHash = settlement.settlementTxHash;
    } else {
      console.log(`[API Chain Settle] Skipping payment settlement because verdict failed or cheat detected.`);
    }

    const result: ChainResult = {
      agentId: verdict.agentId,
      reputationTxHash: reputationTxHash!,
      paymentSettled,
      settlementTxHash,
      newReputationScore,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API Chain Settle] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
