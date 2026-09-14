import React from "react";
import { ActivityIndicator } from "react-native";
import { screen } from "@testing-library/react-native";
import { LoadingScreen } from "../LoadingScreen";
import { renderWithProviders } from "../../test-utils";

describe("LoadingScreen", () => {
  it("shows a spinner and nothing else", () => {
    renderWithProviders(<LoadingScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
    expect(screen.UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
    expect(screen.queryByText(/./)).toBeNull();
  });

  it("fills the screen, so nothing shows through behind it", () => {
    renderWithProviders(<LoadingScreen />);

    expect(screen.getByTestId("loading-screen")).toHaveStyle({
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    });
  });
});
