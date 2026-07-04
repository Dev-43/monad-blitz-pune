import React from "react";

interface ReputationScoreProps {
  score: number;
  agentAddress: string;
}

export function ReputationScore({ score, agentAddress }: ReputationScoreProps) {
  return (
    <div className="bg-[#cfdaf5] border border-[#cecac8] rounded-[40px] p-10 flex flex-col items-center justify-center">
      <h2 className="font-serif-journal text-2xl text-[#242424] mb-6 self-start w-full">
        Agent Reputation
      </h2>

      <div className="relative flex items-center justify-center w-36 h-36 mb-6 rounded-full border border-[#cecac8] bg-[#f6f3f1]">
        <div className="text-center z-10">
          <span className="text-5xl font-mono-journal font-bold tracking-[-0.03em] text-[#242424]">
            {score}
          </span>
          <span className="block text-[10px] font-mono-journal uppercase tracking-[-0.02em] text-[#4e4d4d] mt-1">
            ERC-8004
          </span>
        </div>
      </div>

      <div className="w-full text-center border-t border-[#cecac8] pt-4 mt-2">
        <span className="block text-[10px] font-mono-journal uppercase tracking-[-0.02em] text-[#4e4d4d]">
          Agent ID
        </span>
        <span className="font-mono-journal text-xs text-[#242424] tracking-[-0.02em] mt-1 select-all block break-all">
          {agentAddress}
        </span>
      </div>
    </div>
  );
}

