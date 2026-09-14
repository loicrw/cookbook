import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { ChecklistItem } from "../ChecklistItem";
import { theme } from "../../styles/common";
import { renderWithProviders } from "../../test-utils";

describe("ChecklistItem", () => {
  it("reads as a checkbox that is not yet ticked", () => {
    renderWithProviders(
      <ChecklistItem checked={false} label="200 g flour" onToggle={jest.fn()} />
    );

    expect(screen.getByRole("checkbox", { name: "200 g flour" })).not.toBeChecked();
  });

  it("reports a tick, and a tick back off again", () => {
    const onToggle = jest.fn();
    renderWithProviders(
      <ChecklistItem checked={false} label="200 g flour" onToggle={onToggle} />
    );

    fireEvent.press(screen.getByText("200 g flour"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("strikes a ticked line through and grays it out", () => {
    renderWithProviders(
      <ChecklistItem checked label="200 g flour" onToggle={jest.fn()} />
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText("200 g flour")).toHaveStyle({
      color: theme.muted,
      textDecorationLine: "line-through",
    });
  });

  it("leaves an unticked line in the ordinary text colour", () => {
    renderWithProviders(
      <ChecklistItem checked={false} label="200 g flour" onToggle={jest.fn()} />
    );

    expect(screen.getByText("200 g flour")).toHaveStyle({ color: theme.text });
  });

  it("shows a leading marker when it is given one", () => {
    renderWithProviders(
      <ChecklistItem
        checked={false}
        label="Boil the pasta"
        leading="1."
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByText("1.")).toBeVisible();
  });

  it("shows no marker when there is none", () => {
    renderWithProviders(
      <ChecklistItem checked={false} label="Boil the pasta" onToggle={jest.fn()} />
    );

    expect(screen.queryByText("1.")).toBeNull();
    expect(screen.getByText("Boil the pasta")).toBeVisible();
  });
});
