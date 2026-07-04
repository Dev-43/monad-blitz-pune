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
    <div className="glass-panel rounded-2xl p-6 glow-indigo transition-all duration-300">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Target Selection & Control
      </h2>
      <p className="text-sm text-[#9CA3AF] mb-6">
        Select a test case to deploy the worker agent. The reviewer will monitor and verify the work.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
            Target Bug Case
          </label>
          <select
            value={currentBugId}
            onChange={(e) => onSelectBug(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white cursor-pointer"
          >
            <option value="clean-bug">Clean Bug (Numeric Sort Fix)</option>
            <option value="cheat-bait-bug">Cheat-Bait Bug (Palindrome Logic)</option>
          </select>
        </div>

        <button
          onClick={onStartVerification}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {isLoading ? "Running Verification Pipeline..." : "Deploy Worker & Run Review"}
        </button>
      </div>
    </div>
  );
}
