import React from "react";
import { screen, waitFor } from "@testing-library/react-native";
import { Text, TextInput } from "../Text";
import { FONT_SIZE_LEVELS } from "../../constants/settings";
import { renderWithProviders, seedStorage } from "../../test-utils";

/** Renders at one of the letter sizes on offer, once storage has been read. */
async function renderAtLevel(ui: React.ReactElement, fontSizeLevel: number) {
  await seedStorage({ settings: { authorName: "", fontSizeLevel } });
  const view = renderWithProviders(ui);
  await waitFor(() =>
    expect(screen.getByTestId("subject")).toHaveStyle({
      fontSize: expect.any(Number),
    })
  );
  return view;
}

describe("Text", () => {
  it("draws at the size the style asks for at the default letter size", async () => {
    await renderAtLevel(
      <Text style={{ fontSize: 20 }} testID="subject">
        Hello
      </Text>,
      2
    );

    expect(screen.getByTestId("subject")).toHaveStyle({ fontSize: 20 });
  });

  it("grows every size by the chosen letter size", async () => {
    await renderAtLevel(
      <Text style={{ fontSize: 20 }} testID="subject">
        Hello
      </Text>,
      4
    );

    expect(screen.getByTestId("subject")).toHaveStyle({
      fontSize: Math.round(20 * FONT_SIZE_LEVELS[4].scale),
    });
  });

  it("shrinks it just as readily", async () => {
    await renderAtLevel(
      <Text style={{ fontSize: 20 }} testID="subject">
        Hello
      </Text>,
      0
    );

    expect(screen.getByTestId("subject")).toHaveStyle({ fontSize: 16 });
  });

  it("scales the line height along with the text", async () => {
    await renderAtLevel(
      <Text style={{ fontSize: 15, lineHeight: 22 }} testID="subject">
        Hello
      </Text>,
      4
    );

    expect(screen.getByTestId("subject")).toHaveStyle({
      fontSize: 21,
      lineHeight: 31,
    });
  });

  it("leaves the line height alone when the style sets none", async () => {
    await renderAtLevel(
      <Text style={{ fontSize: 15 }} testID="subject">
        Hello
      </Text>,
      4
    );

    expect(screen.getByTestId("subject")).not.toHaveStyle({ lineHeight: 21 });
  });

  it("scales from the platform default when a style names no size", async () => {
    await renderAtLevel(<Text testID="subject">Hello</Text>, 4);

    // React Native's own default of 14, at 1.4.
    expect(screen.getByTestId("subject")).toHaveStyle({ fontSize: 20 });
  });

  it("keeps the rest of the style it was given", async () => {
    await renderAtLevel(
      <Text style={{ color: "#ff0000", fontWeight: "700" }} testID="subject">
        Hello
      </Text>,
      2
    );

    expect(screen.getByTestId("subject")).toHaveStyle({
      color: "#ff0000",
      fontWeight: "700",
    });
  });

  it("flattens an array of styles before scaling it", async () => {
    await renderAtLevel(
      <Text style={[{ fontSize: 10 }, { fontSize: 20 }]} testID="subject">
        Hello
      </Text>,
      4
    );

    // The later size wins, and that is what gets scaled.
    expect(screen.getByTestId("subject")).toHaveStyle({ fontSize: 28 });
  });

  it("passes everything else through to the text underneath", async () => {
    await renderAtLevel(
      <Text numberOfLines={2} style={{ fontSize: 15 }} testID="subject">
        Hello
      </Text>,
      2
    );

    expect(screen.getByTestId("subject").props.numberOfLines).toBe(2);
    expect(screen.getByText("Hello")).toBeVisible();
  });
});

describe("TextInput", () => {
  it("follows the letter size the same way", async () => {
    await renderAtLevel(
      <TextInput style={{ fontSize: 15 }} testID="subject" value="" />,
      4
    );

    expect(screen.getByTestId("subject")).toHaveStyle({ fontSize: 21 });
  });

  it("keeps its own props", async () => {
    await renderAtLevel(
      <TextInput
        accessibilityLabel="Amount"
        placeholder="Qty"
        style={{ fontSize: 15 }}
        testID="subject"
        value="200"
      />,
      2
    );

    const input = screen.getByTestId("subject");
    expect(input.props.placeholder).toBe("Qty");
    expect(input.props.value).toBe("200");
    expect(screen.getByLabelText("Amount")).toBeVisible();
  });
});
