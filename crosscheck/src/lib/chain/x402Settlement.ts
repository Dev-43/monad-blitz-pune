import { ReviewerVerdict } from "../shared/types";
import { HTTPFacilitatorClient } from "@x402/core/http";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { publicClient, walletClient } from "./viemClient";

/**
 * Handles the x402 verify and settle calls to the settlement facilitator.
 * Requires gas signature from throwaway wallet on server-side.
 */
export async function settleX402Payment(
  verdict: ReviewerVerdict
): Promise<{ paymentSettled: boolean; settlementTxHash: `0x${string}` | null }> {
  console.log(`[Chain] Settling x402 payment for agent ${verdict.agentId} on success...`);

  if (!verdict.passed || verdict.cheatDetected) {
    return {
      paymentSettled: false,
      settlementTxHash: null,
    };
  }

  if (!walletClient) {
    throw new Error("Wallet client is not initialized. Please verify PRIVATE_KEY in .env");
  }

  try {
    // 1. Compose the EVM client signer
    const signer = toClientEvmSigner(walletClient.account, publicClient);
    
    // 2. Initialize exact EVM scheme
    const scheme = new ExactEvmScheme(signer);

    // 3. Define the requirements for payment (1.00 USDC on Monad testnet to worker agent)
    const paymentRequirements = {
      scheme: "exact",
      network: "eip155:10143" as const,
      asset: "0x534b2f3A21130d7a60830c2Df862319e593943A3", // Circle USDC on Monad Testnet
      amount: "1000000", // $1.00 USDC in atomic units (6 decimals)
      payTo: verdict.agentId,
      maxTimeoutSeconds: 3600,
      extra: {},
    };

    // 4. Generate the signed payload using local account
    const payloadResult = await scheme.createPaymentPayload(2, paymentRequirements);
    const payload = {
      x402Version: payloadResult.x402Version,
      accepted: paymentRequirements,
      payload: payloadResult.payload,
      extensions: payloadResult.extensions,
    };

    // 5. Connect to facilitator and verify then settle
    const facilitator = new HTTPFacilitatorClient({
      url: "https://x402-facilitator.molandak.org",
    });

    console.log(`[Chain] Verifying payment payload with facilitator...`);
    const verifyRes = await facilitator.verify(payload, paymentRequirements);
    if (!verifyRes.isValid) {
      throw new Error(`x402 payment verification failed: ${verifyRes.invalidReason || "Unknown reason"}`);
    }

    console.log(`[Chain] Settling payment with facilitator...`);
    const settleRes = await facilitator.settle(payload, paymentRequirements);
    if (!settleRes.success) {
      throw new Error(`x402 payment settlement failed: ${settleRes.errorReason || "Unknown reason"}`);
    }

    console.log(`[Chain] Settlement successful. Tx hash: ${settleRes.transaction}`);
    return {
      paymentSettled: true,
      settlementTxHash: settleRes.transaction as `0x${string}`,
    };
  } catch (error: any) {
    console.error(`[Chain] Error settling payment via x402:`, error);
    throw error;
  }
}
