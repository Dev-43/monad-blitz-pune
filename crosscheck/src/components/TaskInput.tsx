import React from "react";

interface TaskInputProps {
  currentBugId: string;
  onSelectBug: (bugId: string) => void;
  isLoading: boolean;
  onStartVerification: () => void;
}

export function TaskInput({
  currentBugId,
  onSelectBug,
  isLoading,
  onStartVerification,
}: TaskInputProps) {
  return (
    <div className="bg-transparent border border-[#cecac8] rounded-[40px] p-10 flex flex-col justify-between">
      <div>
        <h2 className="font-serif-journal text-2xl text-[#242424] mb-4">
          Target Selection & Control
        </h2>
        <p className="font-mono-journal text-sm text-[#4e4d4d] tracking-[-0.02em] mb-6 leading-relaxed">
          Select a test case to deploy the worker agent. The reviewer will monitor and verify the work.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono-journal text-[#797776] uppercase tracking-[-0.02em] mb-2 font-medium">
              Target Bug Case
            </label>
            <select
              value={currentBugId}
              onChange={(e) => onSelectBug(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#f6f3f1] border border-[#cecac8] rounded-[16px] px-4 py-3 text-sm font-mono-journal tracking-[-0.02em] text-[#242424] focus:outline-none focus:border-[#242424] cursor-pointer"
            >
              <option value="clean-bug">Clean Bug (Numeric Sort Fix)</option>
              <option value="cheat-bait-bug">Cheat-Bait Bug (Palindrome Logic)</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={onStartVerification}
        disabled={isLoading}
        className="w-full bg-[#2b59d1] hover:bg-[#1f42a1] text-white font-mono-journal text-xs font-bold uppercase tracking-[-0.02em] py-4 px-8 rounded-[100px] transition-colors disabled:opacity-50 disabled:pointer-events-none mt-6"
      >
        {isLoading ? "Running Verification Pipeline..." : "Deploy Worker & Run Review"}
      </button>
    </div>
  );
}

