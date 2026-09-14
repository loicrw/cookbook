import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../context/AppDataContext";
import { scaleFont, spacing, styles, theme } from "../styles/common";
import { Text } from "./Text";

/** Line height of a label, before the letter size is applied. */
const LINE_HEIGHT = 22;

interface ChecklistItemProps {
  checked: boolean;
  label: string;
  onToggle: () => void;
  /** Shown before the label, e.g. a step number. */
  leading?: string;
}

/** One tickable line. Ticking it grays the text out and strikes it through. */
export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  checked,
  label,
  onToggle,
  leading,
}) => {
  // The box and its icon are not text, so they are sized by hand to match.
  const { fontScale } = useSettings();
  const boxHeight = scaleFont(LINE_HEIGHT, fontScale);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [itemStyles.row, pressed && styles.buttonPressed]}
    >
      <View style={[itemStyles.box, { height: boxHeight }]}>
        <Ionicons
          color={checked ? theme.muted : theme.primary}
          name={checked ? "checkbox" : "square-outline"}
          size={scaleFont(20, fontScale)}
        />
      </View>

      {!!leading && (
        <Text style={[itemStyles.leading, checked && itemStyles.done]}>
          {leading}
        </Text>
      )}

      <Text style={[itemStyles.label, checked && itemStyles.done]}>
        {label}
      </Text>
    </Pressable>
  );
};

const itemStyles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  box: {
    // Centres the icon against the first line of a label that wraps.
    justifyContent: "center",
  },
  leading: {
    color: theme.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: LINE_HEIGHT,
  },
  label: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
  },
  done: {
    color: theme.muted,
    textDecorationLine: "line-through",
  },
});
