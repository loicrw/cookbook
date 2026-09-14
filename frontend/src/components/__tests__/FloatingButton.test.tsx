import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { FloatingButton } from "../FloatingButton";
import { renderWithProviders } from "../../test-utils";

describe("FloatingButton", () => {
  it("is reachable by the label it was given, having no text of its own", () => {
    renderWithProviders(
      <FloatingButton
        accessibilityLabel="Edit this recipe"
        icon="pencil"
        onPress={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Edit this recipe" })
    ).toBeVisible();
  });

  it("reports a press", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <FloatingButton
        accessibilityLabel="Add to my basket"
        icon="basket-outline"
        onPress={onPress}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "Add to my basket" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("stays round whatever position the caller puts it in", () => {
    renderWithProviders(
      <FloatingButton
        accessibilityLabel="Add"
        icon="add"
        onPress={jest.fn()}
        style={{ bottom: 16 }}
      />
    );

    expect(screen.getByRole("button", { name: "Add" })).toHaveStyle({
      borderRadius: 28,
      bottom: 16,
      height: 56,
      width: 56,
    });
  });
});
