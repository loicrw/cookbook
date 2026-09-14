import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, theme } from "../styles/common";

interface FloatingButtonProps {
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** A round icon button meant to sit over the content it acts on. */
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  accessibilityLabel,
  icon,
  onPress,
  style,
}) => (
  <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      floatingStyles.button,
      pressed && styles.buttonPressed,
      style,
    ]}
  >
    <Ionicons color="#fff" name={icon} size={26} />
  </Pressable>
);

const floatingStyles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: 28,
    elevation: 4,
    height: 56,
    justifyContent: "center",
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    width: 56,
  },
});
