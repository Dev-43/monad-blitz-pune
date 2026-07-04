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
  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case "running":
        return "border-yellow-500 text-yellow-400 bg-yellow-950/20";
      case "success":
        return "border-emerald-500 text-emerald-400 bg-emerald-950/20";
      case "failed":
        return "border-rose-500 text-rose-400 bg-rose-950/20";
      case "cheated":
        return "border-amber-600 text-amber-500 bg-amber-950/20";
      default:
        return "border-gray-800 text-gray-500 bg-[#111827]/40";
    }
  };

  const steps = [
    {
      name: "Worker Agent",
      desc: diffSummary || "Generating code patch",
      status: workerStatus,
    },
    {
      name: "Reviewer Sandbox",
      desc: verdictReason || "Running tests & anti-cheat checks",
      status: reviewerStatus,
    },
    {
      name: "On-Chain Registry",
      desc: txHash ? `Settled tx: ${txHash.slice(0, 10)}...` : "Writing reputation and payment settlement",
      status: chainStatus,
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Pipeline Monitor
      </h2>

      <div className="space-y-6 relative">
        {/* Connection line between steps */}
        <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-800 -z-10" />

        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0 font-bold transition-all duration-300 ${getStatusColor(
                step.status
              )}`}
            >
              {idx + 1}
            </div>
            <div className="flex-grow pt-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">{step.name}</h3>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    step.status === "success"
                      ? "text-emerald-400"
                      : step.status === "failed" || step.status === "cheated"
                      ? "text-rose-400"
                      : step.status === "running"
                      ? "text-yellow-400"
                      : "text-gray-500"
                  }`}
                >
                  {step.status}
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF] mt-1 break-all">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
