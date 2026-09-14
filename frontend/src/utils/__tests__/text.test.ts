import { cookedSummary, plural, timesCooked } from "../text";

describe("plural", () => {
  it("keeps the bare noun for exactly one", () => {
    expect(plural(1, "step")).toBe("1 step");
  });

  it("adds an s for anything else, zero included", () => {
    expect(plural(0, "step")).toBe("0 steps");
    expect(plural(2, "step")).toBe("2 steps");
    expect(plural(12, "ingredient")).toBe("12 ingredients");
  });
});

describe("timesCooked", () => {
  it("reads as words up to one, and as a count beyond it", () => {
    expect(timesCooked(0)).toBe("never");
    expect(timesCooked(1)).toBe("once");
    expect(timesCooked(2)).toBe("2 times");
    expect(timesCooked(37)).toBe("37 times");
  });
});

describe("cookedSummary", () => {
  it("states the absence rather than counting zero", () => {
    expect(cookedSummary(0)).toBe("not cooked yet");
  });

  it("builds on timesCooked for anything cooked", () => {
    expect(cookedSummary(1)).toBe("cooked once");
    expect(cookedSummary(4)).toBe("cooked 4 times");
  });
});
