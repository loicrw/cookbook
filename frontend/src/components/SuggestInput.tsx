import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { spacing, styles, theme } from "../styles/common";
import { Text, TextInput } from "./Text";

interface SuggestInputProps {
  accessibilityLabel?: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Values already used elsewhere in the cookbook, offered while typing. */
  suggestions: string[];
  value: string;
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

/**
 * A free-text field that offers matching values already used in the cookbook,
 * the same way tag entry does. Suggestions only show while the field has focus
 * so that neighbouring rows are not pushed around as the user types.
 */
export const SuggestInput: React.FC<SuggestInputProps> = ({
  accessibilityLabel,
  onChangeText,
  placeholder,
  suggestions,
  value,
  inputStyle,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    []
  );

  const matches = useMemo(() => {
    const needle = value.trim().toLowerCase();
    return suggestions
      .filter((option) => option.toLowerCase() !== needle)
      .filter((option) => !needle || option.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [suggestions, value]);

  return (
    <View style={style}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        onBlur={() => {
          // Tapping a suggestion blurs the field first, so hiding the list is
          // deferred long enough for that press to land.
          blurTimer.current = setTimeout(() => setFocused(false), 150);
        }}
        onChangeText={onChangeText}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[styles.input, inputStyle]}
        value={value}
      />

      {focused && matches.length > 0 && (
        <View style={suggestStyles.list}>
          {matches.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option}
              onPress={() => {
                onChangeText(option);
                setFocused(false);
              }}
              style={({ pressed }) => [
                suggestStyles.option,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text numberOfLines={1} style={suggestStyles.optionText}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const suggestStyles = StyleSheet.create({
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  option: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  optionText: {
    color: theme.muted,
    fontSize: 12,
  },
});
