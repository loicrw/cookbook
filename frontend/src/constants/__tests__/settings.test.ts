import {
  DEFAULT_FONT_SIZE_LEVEL,
  FONT_SIZE_LEVELS,
  migrateFontSizeLevel,
} from "../settings";

describe("FONT_SIZE_LEVELS", () => {
  it("runs from smallest to largest", () => {
    const scales = FONT_SIZE_LEVELS.map((level) => level.scale);
    expect(scales).toEqual([...scales].sort((a, b) => a - b));
  });

  it("leaves the text as authored at the default stop", () => {
    expect(FONT_SIZE_LEVELS[DEFAULT_FONT_SIZE_LEVEL].scale).toBe(1);
  });

  it("puts the default in the middle, so the slider moves either way", () => {
    expect(DEFAULT_FONT_SIZE_LEVEL).toBeGreaterThan(0);
    expect(DEFAULT_FONT_SIZE_LEVEL).toBeLessThan(FONT_SIZE_LEVELS.length - 1);
  });

  it("labels every stop", () => {
    for (const level of FONT_SIZE_LEVELS) {
      expect(level.label).toBeTruthy();
    }
  });
});

describe("migrateFontSizeLevel", () => {
  it("moves every pre-v5 level along by the stop added below Default", () => {
    expect(migrateFontSizeLevel(0)).toBe(1);
    expect(migrateFontSizeLevel(1)).toBe(2);
    expect(migrateFontSizeLevel(2)).toBe(3);
    expect(migrateFontSizeLevel(3)).toBe(4);
  });

  it("holds the largest stop at the largest, there being no higher one", () => {
    expect(migrateFontSizeLevel(4)).toBe(4);
  });

  it("falls back to the default for a level that was never on offer", () => {
    expect(migrateFontSizeLevel(9)).toBe(DEFAULT_FONT_SIZE_LEVEL);
    expect(migrateFontSizeLevel(-1)).toBe(DEFAULT_FONT_SIZE_LEVEL);
  });

  it("only ever lands on a stop that exists", () => {
    for (let level = 0; level < 8; level += 1) {
      expect(FONT_SIZE_LEVELS[migrateFontSizeLevel(level)]).toBeDefined();
    }
  });

  it("keeps the v4 default on the current default", () => {
    // v4's list began at "Small", so its default sat at index 1.
    expect(migrateFontSizeLevel(1)).toBe(DEFAULT_FONT_SIZE_LEVEL);
  });
});
