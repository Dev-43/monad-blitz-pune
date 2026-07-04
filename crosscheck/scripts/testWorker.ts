import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { generatePatch } from "../src/lib/worker/generatePatch";

async function main() {
  console.log("=== Testing Worker Patch Generation ===");

  const bugId = "clean-bug";
  const originalFile = "buggy.ts";
  
  const testCaseDir = path.join(process.cwd(), "test-cases", "clean-bug");
  const buggyFilePath = path.join(testCaseDir, "buggy.ts");
  const bugReportPath = path.join(testCaseDir, "bugReport.txt");

  if (!fs.existsSync(buggyFilePath) || !fs.existsSync(bugReportPath)) {
    console.error("Error: Test case files not found in", testCaseDir);
    process.exit(1);
  }

  const buggyFileContents = fs.readFileSync(buggyFilePath, "utf8");
  const bugReportText = fs.readFileSync(bugReportPath, "utf8");
  const agentId = "0x9999999999999999999999999999999999999999";

  try {
    const output = await generatePatch({
      bugId,
      originalFile,
      buggyFileContents,
      bugReportText,
      agentId,
    });

    console.log("\n=== Worker Output ===");
    console.log("agentId:", output.agentId);
    console.log("bugId:", output.bugId);
    console.log("originalFile:", output.originalFile);
    console.log("diffSummary:", output.diffSummary);
    console.log("\n=== Patched File Contents ===");
    console.log(output.patchedFile);
    console.log("=============================\n");
  } catch (error) {
    console.error("Error generating patch:", error);
    process.exit(1);
  }
}

main();
