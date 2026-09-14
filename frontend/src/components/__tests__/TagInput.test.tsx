import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { TagInput } from "../TagInput";
import { renderWithProviders } from "../../test-utils";

const suggestions = ["pasta", "quick", "vegetarian", "weeknight"];

function renderTags(value: string[] = [], onChange = jest.fn()) {
  renderWithProviders(
    <TagInput onChange={onChange} suggestions={suggestions} value={value} />
  );
  return {
    field: screen.getByPlaceholderText("e.g. vegetarian, quick"),
    onChange,
  };
}

describe("TagInput", () => {
  it("shows the tags already chosen", () => {
    renderTags(["pasta", "quick"]);

    expect(screen.getByText("pasta")).toBeVisible();
    expect(screen.getByText("quick")).toBeVisible();
  });

  it("offers the cookbook's other tags as suggestions", () => {
    renderTags();

    for (const tag of suggestions) {
      expect(screen.getByText(tag)).toBeVisible();
    }
  });

  it("stops offering a tag that has been chosen", () => {
    renderTags(["pasta"]);

    // Once chosen it appears as a chip to remove, not as a suggestion.
    expect(
      screen.getByRole("button", { name: "Remove tag pasta" })
    ).toBeVisible();
    expect(screen.getAllByText("pasta")).toHaveLength(1);
  });

  it("narrows the suggestions as the user types", () => {
    const { field } = renderTags();

    fireEvent.changeText(field, "week");

    expect(screen.getByText("weeknight")).toBeVisible();
    expect(screen.queryByText("pasta")).toBeNull();
  });

  it("adds a suggestion when it is tapped", () => {
    const { onChange } = renderTags([]);

    fireEvent.press(screen.getByText("vegetarian"));

    expect(onChange).toHaveBeenCalledWith(["vegetarian"]);
  });

  it("keeps the tags already chosen when another is added", () => {
    const { onChange } = renderTags(["pasta"]);

    fireEvent.press(screen.getByText("quick"));

    expect(onChange).toHaveBeenCalledWith(["pasta", "quick"]);
  });

  it("creates a tag the cookbook has never seen", () => {
    const { field, onChange } = renderTags();

    fireEvent.changeText(field, "  brunch  ");
    fireEvent.press(screen.getByRole("button", { name: "Add tag" }));

    expect(onChange).toHaveBeenCalledWith(["brunch"]);
  });

  it("creates one on submit from the keyboard too", () => {
    const { field, onChange } = renderTags();

    fireEvent.changeText(field, "brunch");
    fireEvent(field, "submitEditing");

    expect(onChange).toHaveBeenCalledWith(["brunch"]);
  });

  it("clears the field once a tag has been added", () => {
    const { field } = renderTags();

    fireEvent.changeText(field, "brunch");
    fireEvent(field, "submitEditing");

    expect(field.props.value).toBe("");
  });

  it("refuses a tag that is already there, whatever its case", () => {
    const { field, onChange } = renderTags(["Pasta"]);

    fireEvent.changeText(field, "pasta");
    fireEvent(field, "submitEditing");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("refuses a tag that is nothing but whitespace", () => {
    const { field, onChange } = renderTags();

    fireEvent.changeText(field, "   ");
    fireEvent(field, "submitEditing");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("cannot add while the field is empty", () => {
    renderTags();

    expect(screen.getByRole("button", { name: "Add tag" })).toBeDisabled();
  });

  it("removes a tag when its chip is tapped", () => {
    const { onChange } = renderTags(["pasta", "quick"]);

    fireEvent.press(screen.getByRole("button", { name: "Remove tag pasta" }));

    expect(onChange).toHaveBeenCalledWith(["quick"]);
  });

  it("shows no chip row before anything has been chosen", () => {
    renderTags();

    expect(screen.queryByLabelText(/^Remove tag/)).toBeNull();
  });

  it("offers nothing more once every tag is chosen", () => {
    renderTags(suggestions);

    expect(screen.getAllByLabelText(/^Remove tag/)).toHaveLength(
      suggestions.length
    );
    // Each tag now appears once, as a chip.
    for (const tag of suggestions) {
      expect(screen.getAllByText(tag)).toHaveLength(1);
    }
  });
});
