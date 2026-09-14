import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Recipe } from "@/src/types/app";
import { RecipeForm } from "@/src/components";
import { useRecipes, useSettings } from "@/src/context/AppDataContext";

/**
 * The "add recipe" flow reached from the bottom bar.
 *
 * The form is remounted via `formKey` after a save or cancel so the next visit
 * starts blank. Simply switching tabs keeps the draft intact.
 */
export default function AddRecipeScreen() {
  const { addRecipe, allIngredientNames, allTags, allUnits } = useRecipes();
  const { settings } = useSettings();
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  const leave = () => {
    setFormKey((key) => key + 1);
    router.navigate("/");
  };

  const handleSave = (recipe: Recipe) => {
    addRecipe(recipe);
    leave();
  };

  return (
    <RecipeForm
      defaultAuthor={settings.authorName}
      existingIngredientNames={allIngredientNames}
      existingTags={allTags}
      existingUnits={allUnits}
      key={formKey}
      onCancel={leave}
      onSave={handleSave}
      submitLabel="Save recipe"
    />
  );
}
