import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AppButton,
  ChecklistItem,
  LoadingScreen,
  ManualItemInput,
  Stepper,
  Text,
} from "@/src/components";
import { useBasket, useRecipes } from "@/src/context/AppDataContext";
import {
  formatIngredient,
  formatManualItem,
  ingredientKey,
  manualItemKey,
} from "@/src/utils/recipes";
import { plural } from "@/src/utils/text";
import { spacing, styles, theme } from "@/src/styles/common";

/**
 * The shopping list: the ingredients of the recipes added from the recipe view,
 * and whatever the user has put on the list by hand.
 */
export default function BasketScreen() {
  const basket = useBasket();
  const { allIngredientNames, allUnits } = useRecipes();

  if (basket.loading) return <LoadingScreen />;

  const hasRecipes = basket.items.length > 0;
  const lineCount = basket.ingredients.length + basket.manualItems.length;

  return (
    <ScrollView
      contentContainerStyle={basketStyles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
    >
      {hasRecipes ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recipes</Text>

            {basket.items.map(({ recipe, servings }) => (
              <View key={recipe.id} style={basketStyles.recipeRow}>
                <Text numberOfLines={2} style={basketStyles.recipeTitle}>
                  {recipe.title}
                </Text>

                <Stepper
                  compact
                  label={`servings of ${recipe.title}`}
                  onChange={(next) => basket.addRecipe(recipe.id, next)}
                  value={servings}
                />

                <Pressable
                  accessibilityLabel={`Remove ${recipe.title} from the basket`}
                  accessibilityRole="button"
                  onPress={() => basket.removeRecipe(recipe.id)}
                  style={({ pressed }) => [
                    basketStyles.remove,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </Pressable>
              </View>
            ))}

            <Text style={[styles.mutedText, basketStyles.hint]}>
              Amounts are scaled to the servings you set here.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items for recipes</Text>

            {basket.ingredients.map((ingredient) => {
              const key = ingredientKey(ingredient);

              return (
                <ChecklistItem
                  checked={basket.ticked.has(key)}
                  key={key}
                  label={formatIngredient(ingredient)}
                  onToggle={() => basket.toggleTicked(key)}
                />
              );
            })}

            <Text style={[styles.mutedText, basketStyles.hint]}>
              {plural(basket.ingredients.length, "item")} from{" "}
              {plural(basket.items.length, "recipe")}.
            </Text>
          </View>
        </>
      ) : (
        <View style={[styles.card, basketStyles.empty]}>
          <Ionicons name="basket-outline" size={32} color={theme.muted} />
          <Text style={basketStyles.emptyTitle}>No recipes on the list</Text>
          <Text style={[styles.mutedText, basketStyles.emptyBody]}>
            Open a recipe and tap the basket button to add its ingredients, or add
            what you need by hand below.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Manually added</Text>

        {basket.manualItems.map((item) => {
          const key = manualItemKey(item);

          return (
            <View key={key} style={basketStyles.manualRow}>
              <View style={basketStyles.manualLine}>
                <ChecklistItem
                  checked={basket.ticked.has(key)}
                  label={formatManualItem(item)}
                  onToggle={() => basket.toggleTicked(key)}
                />
              </View>

              <Pressable
                accessibilityLabel={`Remove ${item.name} from the list`}
                accessibilityRole="button"
                onPress={() => basket.removeManualItem(item.id)}
                style={({ pressed }) => [
                  basketStyles.remove,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </Pressable>
            </View>
          );
        })}

        <Text style={[styles.mutedText, basketStyles.hint]}>
          Anything else you need. An amount and a unit are optional.
        </Text>

        <ManualItemInput
          existingNames={allIngredientNames}
          existingUnits={allUnits}
          onAdd={basket.addManualItem}
        />
      </View>

      {lineCount > 0 && (
        <>
          <Text style={[styles.mutedText, basketStyles.total]}>
            {plural(lineCount, "item")} to shop for. Ticks are kept until you are
            done.
          </Text>
          <AppButton label="Done!" onPress={basket.clear} />
        </>
      )}
    </ScrollView>
  );
}

const basketStyles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  recipeRow: {
    alignItems: "center",
    borderTopColor: theme.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  recipeTitle: {
    color: theme.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  remove: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  manualRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  manualLine: {
    flex: 1,
  },
  hint: {
    fontSize: 13,
    marginTop: spacing.md,
  },
  total: {
    fontSize: 13,
    textAlign: "center",
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyBody: {
    textAlign: "center",
  },
});
