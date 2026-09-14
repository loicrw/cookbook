import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, styles, theme } from "../styles/common";
import { Text } from "./Text";

interface StepperProps {
  /**
   * What is being counted, read out by the buttons, e.g. "servings" or
   * "servings of Garlic Bread". Written lower case, mid-sentence.
   */
  label: string;
  onChange: (value: number) => void;
  value: number;
  /** Smaller controls, for sitting inside a list row. */
  compact?: boolean;
  max?: number;
  min?: number;
}

/** A number with a minus and a plus, all on one line. */
export const Stepper: React.FC<StepperProps> = ({
  label,
  onChange,
  value,
  compact = false,
  max = 99,
  min = 1,
}) => {
  const button = compact ? stepperStyles.compactButton : stepperStyles.button;
  const iconSize = compact ? 16 : 20;

  const Button = ({
    action,
    disabled,
    icon,
    name,
  }: {
    action: number;
    disabled: boolean;
    icon: "add" | "remove";
    name: string;
  }) => (
    <Pressable
      accessibilityLabel={`${name} ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onChange(value + action)}
      style={({ pressed }) => [
        button,
        pressed && styles.buttonPressed,
        disabled && stepperStyles.disabled,
      ]}
    >
      <Ionicons color={theme.text} name={icon} size={iconSize} />
    </Pressable>
  );

  return (
    <View style={stepperStyles.row}>
      <Button action={-1} disabled={value <= min} icon="remove" name="Fewer" />
      <Text
        style={[
          stepperStyles.value,
          compact && stepperStyles.compactValue,
        ]}
      >
        {value}
      </Text>
      <Button action={1} disabled={value >= max} icon="add" name="More" />
    </View>
  );
};

const stepperStyles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  compactButton: {
    alignItems: "center",
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  disabled: {
    opacity: 0.4,
  },
  value: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
  compactValue: {
    fontSize: 15,
    minWidth: 22,
  },
});
