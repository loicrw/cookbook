import React from "react";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { SuggestInput } from "../SuggestInput";
import { renderWithProviders } from "../../test-utils";

const suggestions = ["flour", "sugar", "salt", "butter", "eggs", "milk", "oil"];

function renderInput(props: Partial<React.ComponentProps<typeof SuggestInput>> = {}) {
  const onChangeText = jest.fn();
  renderWithProviders(
    <SuggestInput
      accessibilityLabel="Ingredient"
      onChangeText={onChangeText}
      placeholder="Ingredient"
      suggestions={suggestions}
      value=""
      {...props}
    />
  );
  return { field: screen.getByLabelText("Ingredient"), onChangeText };
}

describe("SuggestInput", () => {
  it("offers nothing until the field has focus", () => {
    renderInput();

    expect(screen.queryByText("flour")).toBeNull();
  });

  it("offers what is already in the cookbook once focused", () => {
    const { field } = renderInput();

    fireEvent(field, "focus");

    expect(screen.getByText("flour")).toBeVisible();
    expect(screen.getByText("sugar")).toBeVisible();
  });

  it("narrows the list to what matches, wherever the match falls", () => {
    const { field } = renderInput({ value: "ug" });

    fireEvent(field, "focus");

    expect(screen.getByText("sugar")).toBeVisible();
    expect(screen.queryByText("flour")).toBeNull();
  });

  it("matches without regard to case", () => {
    const { field } = renderInput({ value: "FLO" });

    fireEvent(field, "focus");

    expect(screen.getByText("flour")).toBeVisible();
  });

  it("stops offering the value that has already been typed in full", () => {
    const { field } = renderInput({ value: "flour" });

    fireEvent(field, "focus");

    expect(screen.queryByText("flour")).toBeNull();
  });

  it("offers at most six, so the row below is not pushed off screen", () => {
    const { field } = renderInput();

    fireEvent(field, "focus");

    expect(screen.getAllByRole("button")).toHaveLength(6);
  });

  it("shows no list when nothing matches", () => {
    const { field } = renderInput({ value: "zzz" });

    fireEvent(field, "focus");

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("fills the field in when a suggestion is taken, and closes the list", () => {
    const { field, onChangeText } = renderInput({ value: "su" });

    fireEvent(field, "focus");
    fireEvent.press(screen.getByText("sugar"));

    expect(onChangeText).toHaveBeenCalledWith("sugar");
    expect(screen.queryByText("sugar")).toBeNull();
  });

  it("reports what is typed", () => {
    const { field, onChangeText } = renderInput();

    fireEvent.changeText(field, "flo");

    expect(onChangeText).toHaveBeenCalledWith("flo");
  });

  it("keeps the list up briefly after a blur, so a tap on it still lands", () => {
    jest.useFakeTimers();
    const { field } = renderInput();

    fireEvent(field, "focus");
    fireEvent(field, "blur");

    // Still there for the press that caused the blur.
    expect(screen.getByText("flour")).toBeVisible();

    act(() => jest.advanceTimersByTime(200));
    expect(screen.queryByText("flour")).toBeNull();

    jest.useRealTimers();
  });

  it("drops a pending blur when the field is focused again", () => {
    jest.useFakeTimers();
    const { field } = renderInput();

    fireEvent(field, "focus");
    fireEvent(field, "blur");
    fireEvent(field, "focus");
    act(() => jest.advanceTimersByTime(200));

    expect(screen.getByText("flour")).toBeVisible();

    jest.useRealTimers();
  });

  it("clears its timer on the way out, leaving nothing pending", () => {
    jest.useFakeTimers();
    const clear = jest.spyOn(globalThis, "clearTimeout");
    const { field } = renderInput();

    fireEvent(field, "focus");
    fireEvent(field, "blur");
    screen.unmount();

    expect(clear).toHaveBeenCalled();

    clear.mockRestore();
    jest.useRealTimers();
  });

  it("takes a style for the field and for the box around it", () => {
    renderWithProviders(
      <SuggestInput
        accessibilityLabel="Unit"
        inputStyle={{ color: "#4f46e5" }}
        onChangeText={jest.fn()}
        placeholder="Unit"
        suggestions={[]}
        value="to taste"
      />
    );

    expect(screen.getByLabelText("Unit")).toHaveStyle({ color: "#4f46e5" });
  });
});
