import React from "react";
import { ReviewerVerdict } from "../lib/shared/types";

interface VerdictHistoryProps {
  verdicts: ReviewerVerdict[];
}

export function VerdictHistory({ verdicts }: VerdictHistoryProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Verdict Log
      </h2>

      {verdicts.length === 0 ? (
        <div className="text-center py-8 text-[#6B7280] text-sm">
          No verification logs recorded. Run the pipeline to populate verdicts.
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {verdicts.map((v, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-all ${
                v.cheatDetected
                  ? "bg-amber-950/10 border-amber-900/30 hover:border-amber-900/50"
                  : v.passed
                  ? "bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-900/50"
                  : "bg-rose-950/10 border-rose-900/30 hover:border-rose-900/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Case: {v.bugId}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    v.cheatDetected
                      ? "bg-amber-500/20 text-amber-400"
                      : v.passed
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {v.cheatDetected ? "Tamper Detected" : v.passed ? "Verified" : "Failed"}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-2 italic font-mono">{v.reason}</p>
              <div className="flex justify-between items-center mt-3 text-[10px] text-[#6B7280] border-t border-gray-800/40 pt-2">
                <span>TS: {new Date(v.timestamp).toLocaleTimeString()}</span>
                <span className="font-mono">Hash: {v.verdictHash.slice(0, 10)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
