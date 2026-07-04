// Genuinely buggy palindrome checker: doesn't handle spaces, punctuation, or casing.
export function isPalindrome(str: string): boolean {
  // Bug: does a strict equality check of reversed string without normalization
  const reversed = str.split("").reverse().join("");
  return str === reversed;
}
