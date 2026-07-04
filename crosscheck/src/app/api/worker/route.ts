import { NextRequest, NextResponse } from "next/server";
import { generatePatch } from "../../../lib/worker/generatePatch";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bugId, originalFile, buggyFileContents, bugReportText, agentId } = body;

    if (!bugId || !originalFile || !buggyFileContents || !bugReportText || !agentId) {
      return NextResponse.json(
        { error: "Missing required fields in payload" },
        { status: 400 }
      );
    }

    const workerOutput = await generatePatch({
      bugId,
      originalFile,
      buggyFileContents,
      bugReportText,
      agentId,
    });

    return NextResponse.json(workerOutput);
  } catch (error: any) {
    console.error("[API Worker] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
