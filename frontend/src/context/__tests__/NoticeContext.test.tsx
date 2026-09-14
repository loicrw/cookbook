import React from "react";
import { fireEvent, render, renderHook, screen } from "@testing-library/react-native";
import { AppButton } from "../../components/AppButton";
import { AppDataProvider } from "../AppDataContext";
import { NoticeProvider, useNotice } from "../NoticeContext";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>
    <NoticeProvider>{children}</NoticeProvider>
  </AppDataProvider>
);

/** A screen that says something the moment its button is pressed. */
function Screen({ message, title }: { message?: string; title: string }) {
  const notify = useNotice();
  return (
    <AppButton label="Tell me" onPress={() => notify(title, message)} />
  );
}

describe("NoticeProvider", () => {
  it("shows nothing until there is something to say", () => {
    render(
      <Providers>
        <Screen title="Import complete" />
      </Providers>
    );

    expect(screen.queryByText("Import complete")).toBeNull();
  });

  it("shows a title and a message when asked to", () => {
    render(
      <Providers>
        <Screen message="Added 2 recipes." title="Import complete" />
      </Providers>
    );

    fireEvent.press(screen.getByText("Tell me"));

    expect(screen.getByText("Import complete")).toBeVisible();
    expect(screen.getByText("Added 2 recipes.")).toBeVisible();
  });

  it("copes with a title and no message", () => {
    render(
      <Providers>
        <Screen title="Saved" />
      </Providers>
    );

    fireEvent.press(screen.getByText("Tell me"));

    expect(screen.getByText("Saved")).toBeVisible();
  });

  it("offers one way out, and closes when it is taken", () => {
    render(
      <Providers>
        <Screen title="Saved" />
      </Providers>
    );

    fireEvent.press(screen.getByText("Tell me"));
    fireEvent.press(screen.getByText("OK"));

    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("replaces what it was saying when told something new", () => {
    function TwoNotices() {
      const notify = useNotice();
      return (
        <>
          <AppButton label="First" onPress={() => notify("First notice")} />
          <AppButton label="Second" onPress={() => notify("Second notice")} />
        </>
      );
    }

    render(
      <Providers>
        <TwoNotices />
      </Providers>
    );

    fireEvent.press(screen.getByText("First"));
    fireEvent.press(screen.getByText("Second"));

    expect(screen.queryByText("First notice")).toBeNull();
    expect(screen.getByText("Second notice")).toBeVisible();
  });

  it("refuses to notify outside a provider", () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useNotice())).toThrow(
      "useNotice must be used inside a NoticeProvider"
    );

    logged.mockRestore();
  });
});
