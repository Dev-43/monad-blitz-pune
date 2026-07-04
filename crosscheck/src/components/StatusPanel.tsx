import React from "react";

export type StepStatus = "idle" | "running" | "success" | "failed" | "cheated";

interface StatusPanelProps {
  workerStatus: StepStatus;
  reviewerStatus: StepStatus;
  chainStatus: StepStatus;
  diffSummary?: string;
  verdictReason?: string;
  txHash?: string;
}

export function StatusPanel({
  workerStatus,
  reviewerStatus,
  chainStatus,
  diffSummary,
  verdictReason,
  txHash,
}: StatusPanelProps) {
  const getStatusTextColor = (status: StepStatus) => {
    switch (status) {
      case "running":
        return "text-[#2b59d1]"; // Lake Blue for active step
      case "success":
        return "text-[#242424]"; // Off-Black for pass
      case "failed":
      case "cheated":
        return "text-[#f37a0a]"; // Crimson/Coral for failure/cheat
      default:
        return "text-[#797776]"; // Smoke for idle
    }
  };

  const steps = [
    {
      name: "Worker Agent",
      desc: diffSummary || "Idle — Waiting for selection",
      status: workerStatus,
    },
    {
      name: "Reviewer Sandbox",
      desc: verdictReason || "Idle — Waiting for worker output",
      status: reviewerStatus,
    },
    {
      name: "On-Chain Registry",
      desc: txHash ? `Settled tx: ${txHash.slice(0, 10)}...` : "Idle — Waiting for verification verdict",
      status: chainStatus,
    },
  ];

  return (
    <div className="bg-transparent border border-[#cecac8] rounded-[40px] p-10 flex flex-col justify-between h-full">
      <div>
        <h2 className="font-serif-journal text-2xl text-[#242424] mb-8">
          Pipeline Monitor
        </h2>

        <div className="space-y-8 relative">
          {/* Connection line between steps */}
          <div className="absolute left-[45px] top-6 bottom-6 w-[1px] bg-[#cecac8] -z-10" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-6 relative">
              <div className="flex-shrink-0 z-10">
                <div
                  className={`rounded-full bg-[#f6f3f1] border border-[#cecac8] text-[12px] font-mono-journal uppercase tracking-[-0.02em] font-bold px-3 py-1.5 min-w-[90px] text-center ${getStatusTextColor(
                    step.status
                  )}`}
                >
                  {step.status}
                </div>
              </div>
              <div className="flex-grow pt-1">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-serif-journal text-lg text-[#242424]">{step.name}</h3>
                </div>
                <p className="font-mono-journal text-xs text-[#4e4d4d] tracking-[-0.02em] leading-relaxed break-all">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

