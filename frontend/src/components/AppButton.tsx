import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import { styles } from "../styles/common";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "danger";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: Variant;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  disabled = false,
  style,
  variant = "primary",
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      variant === "secondary" && styles.buttonSecondary,
      variant === "danger" && styles.buttonDanger,
      pressed && styles.buttonPressed,
      disabled && { opacity: 0.5 },
      style,
    ]}
  >
    <Text
      style={[
        styles.buttonText,
        variant === "secondary" && styles.buttonTextSecondary,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);
