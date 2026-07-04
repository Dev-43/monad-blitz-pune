// Genuinely buggy sort function: fails to sort numbers correctly because of standard JS default sorting behavior.
export function sortNumbers(arr: number[]): number[] {
  // Bug: defaults to alphabetical sorting when no comparator is provided
  return [...arr].sort();
}
