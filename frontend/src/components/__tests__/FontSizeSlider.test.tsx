import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { FontSizeSlider } from "../FontSizeSlider";
import { FONT_SIZE_LEVELS } from "../../constants/settings";
import { renderWithProviders } from "../../test-utils";

/** Width of one stop's slot, as the component lays the ruler out. */
const SLOT = 28;
const TRACK_WIDTH = 328;
const LAST = FONT_SIZE_LEVELS.length - 1;

/** The x a given stop sits at, for a track of TRACK_WIDTH. */
const xOfStop = (level: number) =>
  SLOT / 2 + ((TRACK_WIDTH - SLOT) * level) / LAST;

function renderSlider(level: number, onChange = jest.fn()) {
  renderWithProviders(<FontSizeSlider level={level} onChange={onChange} />);
  const track = screen.getByLabelText("Font size");

  fireEvent(track, "layout", {
    nativeEvent: { layout: { width: TRACK_WIDTH } },
  });

  return { onChange, track };
}

describe("FontSizeSlider", () => {
  it("reads out the size in use, and how many there are", () => {
    renderSlider(2);

    expect(screen.getByLabelText("Font size")).toHaveAccessibilityValue({
      max: FONT_SIZE_LEVELS.length,
      min: 1,
      now: 3,
      text: "Default",
    });
  });

  it("has one stop per letter size, each of them reachable", () => {
    // Dragging to where a stop is drawn has to select that stop, for every
    // size on offer. The slider carries no text, so this is what "one stop
    // per size" means in practice.
    for (let level = 0; level <= LAST; level += 1) {
      const { onChange, track } = renderSlider(level === 0 ? LAST : 0);

      fireEvent(track, "responderRelease", {
        nativeEvent: { locationX: xOfStop(level) },
      });

      expect(onChange).toHaveBeenCalledWith(level);
      screen.unmount();
    }
  });

  it("picks the stop nearest where the user let go", () => {
    const { onChange } = renderSlider(2);

    fireEvent(screen.getByLabelText("Font size"), "responderRelease", {
      nativeEvent: { locationX: xOfStop(4) },
    });

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("follows a drag as it moves", () => {
    const { onChange } = renderSlider(2);
    const track = screen.getByLabelText("Font size");

    fireEvent(track, "responderMove", {
      nativeEvent: { locationX: xOfStop(0) },
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("clamps a drag past either end to the stop at that end", () => {
    const { onChange } = renderSlider(2);
    const track = screen.getByLabelText("Font size");

    fireEvent(track, "responderRelease", { nativeEvent: { locationX: -500 } });
    expect(onChange).toHaveBeenLastCalledWith(0);

    fireEvent(track, "responderRelease", { nativeEvent: { locationX: 5000 } });
    expect(onChange).toHaveBeenLastCalledWith(LAST);
  });

  it("says nothing when the drag lands back on the stop in use", () => {
    const { onChange } = renderSlider(2);

    fireEvent(screen.getByLabelText("Font size"), "responderRelease", {
      nativeEvent: { locationX: xOfStop(2) },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a touch before the track has been measured", () => {
    const onChange = jest.fn();
    renderWithProviders(<FontSizeSlider level={2} onChange={onChange} />);

    fireEvent(screen.getByLabelText("Font size"), "responderRelease", {
      nativeEvent: { locationX: 100 },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("steps one stop at a time for a screen reader", () => {
    const { onChange, track } = renderSlider(2);

    fireEvent(track, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenLastCalledWith(3);

    fireEvent(track, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("will not step past either end", () => {
    const first = renderSlider(0);
    fireEvent(first.track, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(first.onChange).not.toHaveBeenCalled();

    screen.unmount();

    const last = renderSlider(LAST);
    fireEvent(last.track, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(last.onChange).not.toHaveBeenCalled();
  });

  it("claims the touch, so a drag is not read as a scroll", () => {
    const { track } = renderSlider(2);

    expect(track.props.onStartShouldSetResponder()).toBe(true);
    expect(track.props.onMoveShouldSetResponder()).toBe(true);
  });
});
