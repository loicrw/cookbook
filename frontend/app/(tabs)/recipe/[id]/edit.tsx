import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Recipe } from "@/src/types/app";
import {
  AppButton,
  ConfirmDialog,
  LoadingScreen,
  RecipeForm,
  Text,
} from "@/src/components";
import { useRecipes } from "@/src/context/AppDataContext";
import { spacing, styles, theme } from "@/src/styles/common";

/** Opens an existing recipe in the same form used to create one. */
export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    allIngredientNames,
    allTags,
    allUnits,
    deleteRecipe,
    getRecipe,
    loading,
    updateRecipe,
  } = useRecipes();
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const recipe = getRecipe(id);

  const backToRecipe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: "/recipe/[id]", params: { id } });
    }
  };

  if (loading) return <LoadingScreen />;

  if (!recipe) {
    return (
      <View style={[styles.screen, editStyles.missing]}>
        <Text style={editStyles.missingTitle}>Recipe not found</Text>
        <Text style={styles.mutedText}>
          It may have been deleted or replaced by an import.
        </Text>
        <AppButton label="Back to recipes" onPress={() => router.replace("/")} />
      </View>
    );
  }

  const handleSave = (updated: Recipe) => {
    updateRecipe(updated);
    backToRecipe();
  };

  // Going back would land on the view of a recipe that no longer exists.
  const handleDelete = () => {
    setConfirmingDelete(false);
    deleteRecipe(recipe.id);
    router.replace("/");
  };

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${recipe.title}` }} />
      <RecipeForm
        existingIngredientNames={allIngredientNames}
        existingTags={allTags}
        existingUnits={allUnits}
        initialRecipe={recipe}
        onCancel={backToRecipe}
        onDelete={() => setConfirmingDelete(true)}
        onSave={handleSave}
        submitLabel="Save changes"
      />
      <ConfirmDialog
        actions={[
          { label: "Delete", onPress: handleDelete, variant: "danger" },
          {
            label: "Keep recipe",
            onPress: () => setConfirmingDelete(false),
            variant: "secondary",
          },
        ]}
        message={`"${recipe.title}" will be removed from this device. Export your cookbook first if you want a copy.`}
        onDismiss={() => setConfirmingDelete(false)}
        title="Delete this recipe?"
        visible={confirmingDelete}
      />
    </>
  );
}

const editStyles = StyleSheet.create({
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
