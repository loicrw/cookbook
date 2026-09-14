import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { Stepper } from "../Stepper";
import { renderWithProviders } from "../../test-utils";

describe("Stepper", () => {
  it("shows the value it was given", () => {
    renderWithProviders(
      <Stepper label="servings" onChange={jest.fn()} value={4} />
    );

    expect(screen.getByText("4")).toBeVisible();
  });

  it("names both buttons after what is being counted", () => {
    renderWithProviders(
      <Stepper
        label="servings of Garlic Bread"
        onChange={jest.fn()}
        value={2}
      />
    );

    expect(
      screen.getByRole("button", { name: "Fewer servings of Garlic Bread" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "More servings of Garlic Bread" })
    ).toBeVisible();
  });

  it("counts up and down by one", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper label="servings" onChange={onChange} value={4} />
    );

    fireEvent.press(screen.getByRole("button", { name: "More servings" }));
    expect(onChange).toHaveBeenLastCalledWith(5);

    fireEvent.press(screen.getByRole("button", { name: "Fewer servings" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("stops at one by default, rather than counting to nothing", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper label="servings" onChange={onChange} value={1} />
    );

    const fewer = screen.getByRole("button", { name: "Fewer servings" });
    expect(fewer).toBeDisabled();

    fireEvent.press(fewer);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stops at the ceiling it was given", () => {
    const onChange = jest.fn();
    renderWithProviders(
      <Stepper label="servings" max={6} onChange={onChange} value={6} />
    );

    const more = screen.getByRole("button", { name: "More servings" });
    expect(more).toBeDisabled();

    fireEvent.press(more);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes a floor of its own", () => {
    renderWithProviders(
      <Stepper label="items" min={0} onChange={jest.fn()} value={0} />
    );

    expect(screen.getByRole("button", { name: "Fewer items" })).toBeDisabled();
  });

  it("draws smaller controls when it has to sit inside a row", () => {
    const { rerender } = renderWithProviders(
      <Stepper label="servings" onChange={jest.fn()} value={2} />
    );
    const full = screen.getByRole("button", { name: "More servings" });
    expect(full).toHaveStyle({ height: 42, width: 42 });

    rerender(
      <Stepper compact label="servings" onChange={jest.fn()} value={2} />
    );
    expect(screen.getByRole("button", { name: "More servings" })).toHaveStyle({
      height: 30,
      width: 30,
    });
  });
});
