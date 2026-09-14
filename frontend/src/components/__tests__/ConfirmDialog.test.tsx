import React from "react";
import { Text as RNText } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { ConfirmDialog } from "../ConfirmDialog";
import { styles } from "../../styles/common";
import { renderWithProviders } from "../../test-utils";

const ok = { label: "OK", onPress: jest.fn() };

describe("ConfirmDialog", () => {
  it("shows nothing while it is closed", () => {
    renderWithProviders(
      <ConfirmDialog
        actions={[ok]}
        onDismiss={jest.fn()}
        title="Delete this recipe?"
        visible={false}
      />
    );

    expect(screen.queryByText("Delete this recipe?")).toBeNull();
  });

  it("shows its title, its message and its actions when open", () => {
    renderWithProviders(
      <ConfirmDialog
        actions={[ok, { label: "Cancel", onPress: jest.fn() }]}
        message="This cannot be undone."
        onDismiss={jest.fn()}
        title="Delete this recipe?"
        visible
      />
    );

    expect(screen.getByText("Delete this recipe?")).toBeVisible();
    expect(screen.getByText("This cannot be undone.")).toBeVisible();
    expect(screen.getByRole("button", { name: "OK" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  it("leaves out a message it was not given", () => {
    renderWithProviders(
      <ConfirmDialog
        actions={[ok]}
        onDismiss={jest.fn()}
        title="Are you sure?"
        visible
      />
    );

    expect(screen.getAllByText(/./)).toHaveLength(2);
  });

  it("runs the action that was pressed, and only that one", () => {
    const confirm = jest.fn();
    const cancel = jest.fn();

    renderWithProviders(
      <ConfirmDialog
        actions={[
          { label: "Delete", onPress: confirm, variant: "danger" },
          { label: "Keep recipe", onPress: cancel, variant: "secondary" },
        ]}
        onDismiss={jest.fn()}
        title="Delete this recipe?"
        visible
      />
    );

    fireEvent.press(screen.getByText("Delete"));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  it("paints each action in the variant it asked for", () => {
    renderWithProviders(
      <ConfirmDialog
        actions={[
          { label: "Plain", onPress: jest.fn() },
          { label: "Quiet", onPress: jest.fn(), variant: "secondary" },
          { label: "Destructive", onPress: jest.fn(), variant: "danger" },
        ]}
        onDismiss={jest.fn()}
        title="Pick one"
        visible
      />
    );

    expect(screen.getByRole("button", { name: "Plain" })).toHaveStyle({
      backgroundColor: styles.button.backgroundColor,
    });
    expect(screen.getByRole("button", { name: "Quiet" })).toHaveStyle({
      backgroundColor: styles.buttonSecondary.backgroundColor,
    });
    expect(screen.getByRole("button", { name: "Destructive" })).toHaveStyle({
      backgroundColor: styles.buttonDanger.backgroundColor,
    });
  });

  it("shows the extra controls it was given", () => {
    renderWithProviders(
      <ConfirmDialog
        actions={[ok]}
        onDismiss={jest.fn()}
        title="How many servings?"
        visible
      >
        <RNText>A stepper would go here</RNText>
      </ConfirmDialog>
    );

    expect(screen.getByText("A stepper would go here")).toBeVisible();
  });

  it("dismisses on a tap outside the card, but not inside it", () => {
    const onDismiss = jest.fn();

    renderWithProviders(
      <ConfirmDialog
        actions={[ok]}
        message="Tap outside to close"
        onDismiss={onDismiss}
        title="Are you sure?"
        visible
      />
    );

    // The card swallows its own taps so a press on the message stays put.
    fireEvent.press(screen.getByText("Tap outside to close"));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
