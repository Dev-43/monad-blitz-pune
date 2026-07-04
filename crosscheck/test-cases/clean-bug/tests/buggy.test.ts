import { sortNumbers } from "../buggy";

describe("sortNumbers", () => {
  it("should sort a basic list of numbers numerically", () => {
    expect(sortNumbers([10, 2, 5])).toEqual([2, 5, 10]);
  });

  it("should handle empty arrays", () => {
    expect(sortNumbers([])).toEqual([]);
  });

  it("should handle negative numbers", () => {
    expect(sortNumbers([-3, -10, 5, 0])).toEqual([-10, -3, 0, 5]);
  });

  it("should handle already sorted arrays", () => {
    expect(sortNumbers([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
