import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { AppButton } from "../AppButton";
import { styles } from "../../styles/common";
import { renderWithProviders } from "../../test-utils";

describe("AppButton", () => {
  it("shows its label and reports a press", () => {
    const onPress = jest.fn();
    renderWithProviders(<AppButton label="Save recipe" onPress={onPress} />);

    fireEvent.press(screen.getByText("Save recipe"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire while disabled, and says so to a screen reader", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <AppButton disabled label="Export" onPress={onPress} />
    );

    const button = screen.getByRole("button", { name: "Export" });
    expect(button).toBeDisabled();

    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("paints the primary variant by default", () => {
    renderWithProviders(<AppButton label="Go" onPress={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Go" })).toHaveStyle({
      backgroundColor: styles.button.backgroundColor,
    });
  });

  it.each([
    ["secondary", styles.buttonSecondary.backgroundColor],
    ["danger", styles.buttonDanger.backgroundColor],
  ] as const)("paints the %s variant", (variant, backgroundColor) => {
    renderWithProviders(
      <AppButton label="Go" onPress={jest.fn()} variant={variant} />
    );

    expect(screen.getByRole("button", { name: "Go" })).toHaveStyle({
      backgroundColor,
    });
  });

  it("merges a style passed in by the caller", () => {
    renderWithProviders(
      <AppButton label="Go" onPress={jest.fn()} style={{ marginTop: 40 }} />
    );

    expect(screen.getByRole("button", { name: "Go" })).toHaveStyle({
      marginTop: 40,
    });
  });
});
