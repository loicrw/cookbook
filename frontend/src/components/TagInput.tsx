import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, styles, theme } from "../styles/common";
import { Text, TextInput } from "./Text";

interface TagInputProps {
  onChange: (tags: string[]) => void;
  /** Tags already used elsewhere in the cookbook, offered as suggestions. */
  suggestions: string[];
  value: string[];
}

/**
 * Free-text tag entry. Typing filters the tags already used in the cookbook and
 * shows them as tappable suggestions; a tag not in the list is created on submit.
 */
export const TagInput: React.FC<TagInputProps> = ({
  onChange,
  suggestions,
  value,
}) => {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const selected = new Set(value.map((tag) => tag.toLowerCase()));
    const needle = query.trim().toLowerCase();

    return suggestions
      .filter((tag) => !selected.has(tag.toLowerCase()))
      .filter((tag) => !needle || tag.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [query, suggestions, value]);

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (!value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setQuery("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((existing) => existing !== tag));
  };

  return (
    <View>
      {value.length > 0 && (
        <View style={tagStyles.selected}>
          {value.map((tag) => (
            <Pressable
              accessibilityLabel={`Remove tag ${tag}`}
              accessibilityRole="button"
              key={tag}
              onPress={() => removeTag(tag)}
              style={({ pressed }) => [styles.chip, pressed && styles.buttonPressed]}
            >
              <Text style={styles.chipText}>{tag}</Text>
              <Ionicons name="close" size={14} color={theme.primary} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          autoCapitalize="none"
          blurOnSubmit={false}
          onChangeText={setQuery}
          onSubmitEditing={() => addTag(query)}
          placeholder="e.g. vegetarian, quick"
          placeholderTextColor={theme.muted}
          returnKeyType="done"
          style={[styles.input, { flex: 1 }]}
          value={query}
        />
        <Pressable
          accessibilityLabel="Add tag"
          accessibilityRole="button"
          disabled={!query.trim()}
          onPress={() => addTag(query)}
          style={({ pressed }) => [
            tagStyles.addButton,
            pressed && styles.buttonPressed,
            !query.trim() && { opacity: 0.4 },
          ]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {matches.length > 0 && (
        <View style={tagStyles.suggestions}>
          {matches.map((tag) => (
            <Pressable
              accessibilityRole="button"
              key={tag}
              onPress={() => addTag(tag)}
              style={({ pressed }) => [
                tagStyles.suggestion,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={tagStyles.suggestionText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const tagStyles = StyleSheet.create({
  selected: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  suggestion: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  suggestionText: {
    color: theme.muted,
    fontSize: 13,
  },
});
