import React from "react";

interface ReputationScoreProps {
  score: number;
  agentAddress: string;
}

export function ReputationScore({ score, agentAddress }: ReputationScoreProps) {
  // Determine color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-400";
    if (s >= 50) return "text-yellow-400";
    return "text-rose-400";
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300">
      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6 self-start w-full">
        Agent Reputation
      </h2>

      <div className="relative flex items-center justify-center w-36 h-36 mb-6">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-[10px] border-[#1F2937]" />
        
        {/* Dynamic Glowing Ring Indicator */}
        <div
          className={`absolute inset-0 rounded-full border-[10px] transition-all duration-1000 ${
            score >= 80
              ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              : score >= 50
              ? "border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              : "border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
          }`}
        />

        <div className="text-center z-10">
          <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mt-1">
            ERC-8004
          </span>
        </div>
      </div>

      <div className="w-full text-center border-t border-gray-800/80 pt-4 mt-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Agent ID
        </span>
        <span className="font-mono text-sm text-indigo-300 mt-1 select-all block break-all">
          {agentAddress}
        </span>
      </div>
    </div>
  );
}
