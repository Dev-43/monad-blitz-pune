import { NextRequest, NextResponse } from "next/server";
import { writeReputationFeedback } from "../../../../lib/chain/erc8004";
import { ChainResult } from "../../../../lib/shared/types";

export async function POST(req: NextRequest) {
  try {
    const verdict = await req.json();
    const { agentId, passed } = verdict;

    if (!agentId) {
      return NextResponse.json(
        { error: "Invalid ReviewerVerdict payload" },
        { status: 400 }
      );
    }

    // Call on-chain registry feedback
    const { txHash, newScore } = await writeReputationFeedback(verdict);

    const result: ChainResult = {
      agentId,
      reputationTxHash: txHash,
      paymentSettled: false, // will be settled in settle route
      settlementTxHash: null,
      newReputationScore: newScore,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API Chain Reputation] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
