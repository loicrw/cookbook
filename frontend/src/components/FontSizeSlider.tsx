import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FONT_SIZE_LEVELS } from "../constants/settings";
import { spacing, theme } from "../styles/common";

/** Width of one stop's touch slot; also the inset of the track line. */
const SLOT = 28;
/** Height of a ruler mark, and of the row that holds the marks and the line. */
const MARK_HEIGHT = 24;
const LINE_HEIGHT = 4;
/** Diameter of the ball marking the size in use. */
const BALL = 24;

interface FontSizeSliderProps {
  level: number;
  onChange: (level: number) => void;
}

/**
 * A slider with one stop per letter size. Built from the gesture responder
 * rather than a slider library so it behaves the same on web and native.
 */
export const FontSizeSlider: React.FC<FontSizeSliderProps> = ({
  level,
  onChange,
}) => {
  const [width, setWidth] = useState(0);
  const lastLevel = FONT_SIZE_LEVELS.length - 1;

  const selectAt = (x: number) => {
    // The stops sit half a slot in from each edge, so that is the usable span.
    const span = width - SLOT;
    if (span <= 0) return;

    const ratio = (x - SLOT / 2) / span;
    const next = Math.round(Math.min(1, Math.max(0, ratio)) * lastLevel);
    if (next !== level) onChange(next);
  };

  const step = (offset: number) => {
    const next = Math.min(lastLevel, Math.max(0, level + offset));
    if (next !== level) onChange(next);
  };

  return (
    <View
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      accessibilityLabel="Font size"
      accessibilityRole="adjustable"
      accessibilityValue={{
        max: FONT_SIZE_LEVELS.length,
        min: 1,
        now: level + 1,
        text: FONT_SIZE_LEVELS[level].label,
      }}
      onAccessibilityAction={(event) =>
        step(event.nativeEvent.actionName === "increment" ? 1 : -1)
      }
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onMoveShouldSetResponder={() => true}
      onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
      onResponderRelease={(event) => selectAt(event.nativeEvent.locationX)}
      onStartShouldSetResponder={() => true}
      style={sliderStyles.track}
    >
      {/*
        The ruler must not take the pointer: a move over a mark would otherwise
        be reported relative to the mark instead of the track, and the drag
        would jump to the wrong stop.
      */}
      <View pointerEvents="none" style={sliderStyles.ruler}>
        <View style={sliderStyles.line} />

        {FONT_SIZE_LEVELS.map((option, index) => (
          <View key={option.label} style={sliderStyles.slot}>
            <View
              style={index === level ? sliderStyles.ball : sliderStyles.mark}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  track: {
    // Generous, so a drag keeps the pointer inside it while the page reflows
    // around the new letter size.
    height: 56,
    justifyContent: "center",
    marginVertical: spacing.xs,
  },
  // The marks and the line share this row, so centring them here puts the line
  // exactly halfway up every mark.
  ruler: {
    alignItems: "center",
    flexDirection: "row",
    height: MARK_HEIGHT,
    justifyContent: "space-between",
  },
  line: {
    backgroundColor: theme.border,
    borderRadius: LINE_HEIGHT / 2,
    height: LINE_HEIGHT,
    left: SLOT / 2,
    position: "absolute",
    right: SLOT / 2,
    top: (MARK_HEIGHT - LINE_HEIGHT) / 2,
  },
  slot: {
    alignItems: "center",
    width: SLOT,
  },
  // Each stop crosses the line rather than sitting on it, like a ruler mark,
  // and keeps the line's colour so only the ball stands out.
  mark: {
    backgroundColor: theme.border,
    borderRadius: 2,
    height: MARK_HEIGHT,
    width: 3,
  },
  ball: {
    backgroundColor: theme.primary,
    borderRadius: BALL / 2,
    height: BALL,
    width: BALL,
  },
});
