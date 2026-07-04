import { NextRequest, NextResponse } from "next/server";
import { settleX402Payment } from "../../../../lib/chain/x402Settlement";
import { ChainResult } from "../../../../lib/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { verdict, reputationResult } = body;

    if (!verdict || !reputationResult) {
      return NextResponse.json(
        { error: "Invalid payload: requires verdict and reputationResult" },
        { status: 400 }
      );
    }

    // Perform settlement via x402
    const { paymentSettled, settlementTxHash } = await settleX402Payment(verdict);

    const result: ChainResult = {
      agentId: reputationResult.agentId,
      reputationTxHash: reputationResult.reputationTxHash,
      paymentSettled,
      settlementTxHash,
      newReputationScore: reputationResult.newReputationScore,
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
