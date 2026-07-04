import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkerOutput } from "../shared/types";

export interface GeneratePatchInput {
  bugId: string;
  originalFile: string; // File name (e.g. "buggy.ts")
  buggyFileContents: string;
  bugReportText: string;
  agentId: `0x${string}`;
}

/**
 * Calls Gemini API to generate a bug fix patch.
 * Returns a WorkerOutput matching the shared contract.
 */
export async function generatePatch(input: GeneratePatchInput): Promise<WorkerOutput> {
  console.log(`[Worker] Generating patch for bug ${input.bugId}...`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });



  const prompt = `You are an expert developer. Fix the bug in the file according to the bug report.
Return ONLY the complete corrected file contents. Do not include markdown formatting, markdown code block backticks (like \`\`\`), explanations, comments, or any other text before or after the code. The output should be directly compilable/runnable.

File name: ${input.originalFile}

Original Buggy File Contents:
${input.buggyFileContents}

Bug Report:
${input.bugReportText}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let patchedFile = text.trim();
  // Strip markdown code block wrappers if Gemini returns them
  if (patchedFile.startsWith("```")) {
    const lines = patchedFile.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines[lines.length - 1].startsWith("```")) {
      lines.pop();
    }
    patchedFile = lines.join("\n").trim();
  }

  return {
    agentId: input.agentId,
    bugId: input.bugId,
    originalFile: input.originalFile,
    patchedFile,
    diffSummary: `Fixed bug ${input.bugId} in ${input.originalFile}`,
  };
}

