import { scaleFont, spacing, styles, theme } from "../common";

describe("scaleFont", () => {
  it("leaves a size alone at the default scale", () => {
    expect(scaleFont(16, 1)).toBe(16);
  });

  it("rounds to whole pixels, so nothing lands off the grid", () => {
    expect(scaleFont(15, 1.2)).toBe(18);
    expect(scaleFont(11, 0.9)).toBe(10);
    expect(scaleFont(17, 0.8)).toBe(14);
  });

  it("moves in the same direction as the scale", () => {
    expect(scaleFont(20, 1.4)).toBeGreaterThan(scaleFont(20, 1));
    expect(scaleFont(20, 0.8)).toBeLessThan(scaleFont(20, 1));
  });
});

describe("spacing", () => {
  it("steps up in order", () => {
    const steps = [spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl];
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });
});

describe("theme", () => {
  it("gives every token a colour", () => {
    for (const [name, value] of Object.entries(theme)) {
      expect(`${name}: ${value}`).toMatch(/: (#[0-9a-f]{3,8}|rgba?\()/i);
    }
  });
});

describe("styles", () => {
  it("registers every shared style the components ask for", () => {
    expect(Object.keys(styles)).toEqual(
      expect.arrayContaining([
        "screen",
        "card",
        "sectionTitle",
        "label",
        "input",
        "inputMultiline",
        "inputError",
        "errorText",
        "mutedText",
        "button",
        "buttonSecondary",
        "buttonDanger",
        "buttonPressed",
        "buttonText",
        "buttonTextSecondary",
        "chip",
        "chipText",
        "row",
      ])
    );
  });

  it("dims a pressed control rather than hiding it", () => {
    expect(styles.buttonPressed.opacity).toBeGreaterThan(0);
    expect(styles.buttonPressed.opacity).toBeLessThan(1);
  });
});
