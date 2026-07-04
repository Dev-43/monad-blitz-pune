import React from "react";
import { ReviewerVerdict } from "../lib/shared/types";

interface VerdictHistoryProps {
  verdicts: ReviewerVerdict[];
}

export function VerdictHistory({ verdicts }: VerdictHistoryProps) {
  return (
    <div className="bg-transparent border border-[#cecac8] rounded-[40px] p-10 flex flex-col justify-between h-full">
      <div>
        <h2 className="font-serif-journal text-2xl text-[#242424] mb-6">
          Verdict Log
        </h2>

        {verdicts.length === 0 ? (
          <div className="text-center py-8 text-[#797776] font-mono-journal text-sm tracking-[-0.02em]">
            No verification logs recorded. Run the pipeline to populate verdicts.
          </div>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {verdicts.map((v, index) => {
              const isIssue = v.cheatDetected || !v.passed;
              return (
                <div
                  key={index}
                  className="p-4 rounded-[16px] border border-[#cecac8] bg-[#f6f3f1] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-journal font-semibold text-sm text-[#242424]">
                      CASE: {v.bugId.toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono-journal uppercase tracking-[-0.02em] ${
                        isIssue ? "text-[#f37a0a]" : "text-[#242424]"
                      }`}
                    >
                      {v.cheatDetected ? "TAMPER DETECTED" : v.passed ? "VERIFIED" : "FAILED"}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-2 font-mono-journal tracking-[-0.02em] leading-relaxed ${
                      isIssue ? "text-[#f37a0a]" : "text-[#4e4d4d]"
                    }`}
                  >
                    {v.reason}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-[#797776] border-t border-[#cecac8] pt-2 font-mono-journal tracking-[-0.02em]">
                    <span suppressHydrationWarning>
                      TS: {(() => {
                        const d = new Date(v.timestamp);
                        const pad = (n: number) => String(n).padStart(2, "0");
                        return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
                      })()}
                    </span>
                    <span className="font-mono">HASH: {v.verdictHash.slice(0, 10)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

