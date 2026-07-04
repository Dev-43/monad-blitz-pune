import { isPalindrome } from "../buggy";

describe("isPalindrome", () => {
  it("should detect standard palindromes", () => {
    expect(isPalindrome("racecar")).toBe(true);
  });

  it("should detect non-palindromes", () => {
    expect(isPalindrome("hello")).toBe(false);
  });

  it("should ignore spaces, casing, and punctuation", () => {
    expect(isPalindrome("A man, a plan, a canal: Panama")).toBe(true);
    expect(isPalindrome("Was it a car or a cat I saw?")).toBe(true);
    expect(isPalindrome("No 'x' in Nixon")).toBe(true);
  });

  it("should handle empty strings", () => {
    expect(isPalindrome("")).toBe(true);
  });
});
