import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AppButton,
  ChecklistItem,
  ConfirmDialog,
  FloatingButton,
  LoadingScreen,
  Stepper,
  Text,
} from "@/src/components";
import { useBasket, useRecipes } from "@/src/context/AppDataContext";
import { useNotice } from "@/src/context/NoticeContext";
import { formatIngredient } from "@/src/utils/recipes";
import { cookedSummary, plural, timesCooked } from "@/src/utils/text";
import { spacing, styles, theme } from "@/src/styles/common";

/** Toggles one index in a set of ticked list positions. */
function toggleIn(current: Set<number>, index: number): Set<number> {
  const next = new Set(current);
  if (!next.delete(index)) next.add(index);
  return next;
}

/** Read-only view of a recipe: tick your way through it, then log the cook. */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipe, loading, markCooked } = useRecipes();
  const basket = useBasket();
  const notify = useNotice();
  const router = useRouter();
  const [tickedIngredients, setTickedIngredients] = useState(
    () => new Set<number>()
  );
  const [tickedSteps, setTickedSteps] = useState(() => new Set<number>());
  // The servings being shopped for, while the basket dialog is open.
  const [basketServings, setBasketServings] = useState<number | null>(null);

  const recipe = getRecipe(id);

  if (loading) return <LoadingScreen />;

  if (!recipe) {
    return (
      <View style={[styles.screen, viewStyles.missing]}>
        <Text style={viewStyles.missingTitle}>Recipe not found</Text>
        <Text style={styles.mutedText}>
          It may have been deleted or replaced by an import.
        </Text>
        <AppButton label="Back to recipes" onPress={() => router.replace("/")} />
      </View>
    );
  }

  const servingsInBasket = basket.servingsFor(recipe.id);
  const inBasket = servingsInBasket !== undefined;

  const handleDone = () => {
    markCooked(recipe.id);
    setTickedIngredients(new Set());
    setTickedSteps(new Set());
    notify(
      "Nice one!",
      `"${recipe.title}" has now been cooked ${timesCooked(recipe.times_cooked + 1)}.`
    );
  };

  const confirmBasket = () => {
    if (basketServings !== null) basket.addRecipe(recipe.id, basketServings);
    setBasketServings(null);
  };

  const lastCooked = recipe.last_cooked_on
    ? new Date(recipe.last_cooked_on).toLocaleDateString()
    : null;

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />

      <View style={styles.screen}>
        <ScrollView contentContainerStyle={viewStyles.content}>
          <View style={styles.card}>
            <Text style={viewStyles.title}>{recipe.title}</Text>

            {!!recipe.author && (
              <Text style={styles.mutedText}>by {recipe.author}</Text>
            )}

            {!!recipe.description && (
              <Text style={viewStyles.description}>{recipe.description}</Text>
            )}

            <Text style={[styles.mutedText, viewStyles.meta]}>
              Serves {recipe.people_served} ·{" "}
              {cookedSummary(recipe.times_cooked)}
              {lastCooked ? ` · last on ${lastCooked}` : ""}
            </Text>

            {!!recipe.tags?.length && (
              <View style={viewStyles.tags}>
                {recipe.tags.map((tag) => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <ChecklistItem
                checked={tickedIngredients.has(index)}
                key={`${ingredient.name}-${index}`}
                label={formatIngredient(ingredient)}
                onToggle={() =>
                  setTickedIngredients((current) => toggleIn(current, index))
                }
              />
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {recipe.steps.map((step, index) => (
              <ChecklistItem
                checked={tickedSteps.has(index)}
                key={`${step.order}-${index}`}
                label={step.description}
                leading={`${step.order}.`}
                onToggle={() =>
                  setTickedSteps((current) => toggleIn(current, index))
                }
              />
            ))}
          </View>

          <AppButton
            label="Done!"
            onPress={handleDone}
            style={viewStyles.done}
          />
        </ScrollView>

        <View style={viewStyles.actions}>
          <FloatingButton
            accessibilityLabel="Add the ingredients to my basket"
            icon={inBasket ? "basket" : "basket-outline"}
            onPress={() =>
              setBasketServings(servingsInBasket ?? recipe.people_served)
            }
          />
          <FloatingButton
            accessibilityLabel="Edit this recipe"
            icon="pencil"
            onPress={() =>
              router.push({
                pathname: "/recipe/[id]/edit",
                params: { id: recipe.id },
              })
            }
          />
        </View>
      </View>

      <ConfirmDialog
        actions={[
          {
            label: inBasket ? "Update the basket" : "Add to my basket",
            onPress: confirmBasket,
          },
          {
            label: "Cancel",
            onPress: () => setBasketServings(null),
            variant: "secondary",
          },
        ]}
        message={
          inBasket
            ? `"${recipe.title}" is on your shopping list for ${plural(servingsInBasket ?? 0, "serving")}. How many are you shopping for?`
            : `How many servings are you shopping for? The recipe is written for ${plural(recipe.people_served, "serving")}, and the amounts are scaled to whatever you pick.`
        }
        onDismiss={() => setBasketServings(null)}
        title={inBasket ? "Update your basket" : "Add to your basket"}
        visible={basketServings !== null}
      >
        <Stepper
          label="servings"
          onChange={setBasketServings}
          value={basketServings ?? recipe.people_served}
        />
      </ConfirmDialog>
    </>
  );
}

const viewStyles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    // Clears the floating buttons stacked in the bottom corner.
    paddingBottom: 160,
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  meta: {
    marginTop: spacing.sm,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  done: {
    // Keeps the button clear of the floating buttons in the corner.
    marginRight: 72,
  },
  actions: {
    bottom: spacing.lg,
    gap: spacing.md,
    position: "absolute",
    right: spacing.lg,
  },
  missing: {
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  missingTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
