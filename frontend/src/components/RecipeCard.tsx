import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "../types/app";
import { plural } from "../utils/text";
import { spacing, styles, theme } from "../styles/common";
import { Text } from "./Text";

interface RecipeCardProps {
  onPress: () => void;
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ onPress, recipe }) => {
  const tags = recipe.tags ?? [];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${recipe.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        cardStyles.card,
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={cardStyles.header}>
        <Text numberOfLines={2} style={cardStyles.title}>
          {recipe.title}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      </View>

      {!!recipe.description && (
        <Text numberOfLines={3} style={cardStyles.description}>
          {recipe.description}
        </Text>
      )}

      <View style={cardStyles.meta}>
        <Text style={styles.mutedText}>
          Serves {recipe.people_served} ·{" "}
          {plural(recipe.ingredients.length, "ingredient")} ·{" "}
          {plural(recipe.steps.length, "step")}
        </Text>
      </View>

      {tags.length > 0 && (
        <View style={cardStyles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: theme.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: theme.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    marginTop: spacing.xs,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
