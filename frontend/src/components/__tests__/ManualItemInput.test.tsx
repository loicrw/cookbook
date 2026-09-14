import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { ManualItemInput } from "../ManualItemInput";
import { renderWithProviders } from "../../test-utils";

function renderInput(onAdd = jest.fn()) {
  renderWithProviders(
    <ManualItemInput
      existingNames={["flour", "milk"]}
      existingUnits={["g", "ml"]}
      onAdd={onAdd}
    />
  );

  return {
    add: screen.getByRole("button", { name: "Add item" }),
    amount: screen.getByLabelText("Amount (optional)"),
    name: screen.getByLabelText("Item"),
    onAdd,
    unit: screen.getByLabelText("Unit (optional)"),
  };
}

describe("ManualItemInput", () => {
  it("puts a measured item on the list", () => {
    const { add, amount, name, onAdd, unit } = renderInput();

    fireEvent.changeText(name, "potatoes");
    fireEvent.changeText(amount, "2");
    fireEvent.changeText(unit, "kg");
    fireEvent.press(add);

    expect(onAdd).toHaveBeenCalledWith({
      amount: 2,
      name: "potatoes",
      unit: "kg",
    });
  });

  it("puts an item with no measurement on the list", () => {
    const { add, name, onAdd } = renderInput();

    fireEvent.changeText(name, "bin bags");
    fireEvent.press(add);

    expect(onAdd).toHaveBeenCalledWith({ name: "bin bags", unit: "" });
  });

  it("accepts a fraction of a unit", () => {
    const { add, amount, name, onAdd, unit } = renderInput();

    fireEvent.changeText(name, "oil");
    fireEvent.changeText(amount, "0.5");
    fireEvent.changeText(unit, "l");
    fireEvent.press(add);

    expect(onAdd).toHaveBeenCalledWith({ amount: 0.5, name: "oil", unit: "l" });
  });

  it("refuses an item with no name", () => {
    const { add, name, onAdd } = renderInput();

    fireEvent.changeText(name, "   ");
    fireEvent.press(add);

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Give the item a name.")).toBeVisible();
  });

  it("refuses an amount that is not a number", () => {
    const { add, amount, name, onAdd } = renderInput();

    fireEvent.changeText(name, "flour");
    fireEvent.changeText(amount, "abc");
    fireEvent.press(add);

    expect(onAdd).not.toHaveBeenCalled();
    expect(
      screen.getByText("An amount has to be a number above 0, or left empty.")
    ).toBeVisible();
  });

  it("refuses an amount of nothing at all", () => {
    const { add, amount, name, onAdd } = renderInput();

    fireEvent.changeText(name, "flour");
    fireEvent.changeText(amount, "0");
    fireEvent.press(add);

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("empties the row once the item is on the list", () => {
    const { add, amount, name, unit } = renderInput();

    fireEvent.changeText(name, "potatoes");
    fireEvent.changeText(amount, "2");
    fireEvent.changeText(unit, "kg");
    fireEvent.press(add);

    expect(name.props.value).toBe("");
    expect(amount.props.value).toBe("");
    expect(unit.props.value).toBe("");
  });

  it("clears the complaint once the item goes on the list", () => {
    const { add, name } = renderInput();

    fireEvent.press(add);
    expect(screen.getByText("Give the item a name.")).toBeVisible();

    fireEvent.changeText(name, "bin bags");
    fireEvent.press(add);

    expect(screen.queryByText("Give the item a name.")).toBeNull();
  });

  it("offers the names and units already in the cookbook", () => {
    const { name, unit } = renderInput();

    fireEvent(name, "focus");
    expect(screen.getByText("flour")).toBeVisible();

    fireEvent(unit, "focus");
    expect(screen.getByText("ml")).toBeVisible();
  });
});
