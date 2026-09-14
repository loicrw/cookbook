import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Ingredient, Recipe, RecipeDraft } from "../types/app";
import { createId, draftToRecipe, validateDraft } from "../utils/recipes";
import { spacing, styles, theme } from "../styles/common";
import { AppButton } from "./AppButton";
import { SuggestInput } from "./SuggestInput";
import { TagInput } from "./TagInput";
import { Text, TextInput } from "./Text";

/**
 * "to taste" is entered in the unit field rather than through a separate
 * control, which keeps each ingredient on one line. It is a marker, not a unit,
 * so it is never persisted as one.
 */
const TO_TASTE = "to taste";

const isToTaste = (unit: string) => unit.trim().toLowerCase() === TO_TASTE;

/**
 * Amounts and servings are held as text while editing so that half-typed values
 * ("0.", "") survive a keystroke. They are converted to numbers on save.
 */
type IngredientRow = {
  amountText: string;
  key: string;
  name: string;
  unit: string;
};

type StepRow = {
  description: string;
  key: string;
};

type FormErrors = {
  amounts?: string;
  ingredients?: string;
  steps?: string;
  title?: string;
};

interface RecipeFormProps {
  existingIngredientNames: string[];
  existingTags: string[];
  existingUnits: string[];
  onCancel: () => void;
  onSave: (recipe: Recipe) => void;
  /** Pre-fills the author of a new recipe. Existing recipes keep their own. */
  defaultAuthor?: string;
  /** Omitted when creating a new recipe. */
  initialRecipe?: Recipe;
  onDelete?: () => void;
  submitLabel?: string;
}

function toIngredientRows(ingredients: Ingredient[]): IngredientRow[] {
  if (!ingredients.length) return [newIngredientRow()];
  return ingredients.map((ingredient) => ({
    amountText: ingredient.amount === "to taste" ? "" : String(ingredient.amount),
    key: createId(),
    name: ingredient.name,
    unit: ingredient.amount === "to taste" ? TO_TASTE : (ingredient.unit ?? ""),
  }));
}

function newIngredientRow(): IngredientRow {
  return { amountText: "", key: createId(), name: "", unit: "" };
}

function toStepRows(steps: { description: string }[]): StepRow[] {
  if (!steps.length) return [{ description: "", key: createId() }];
  return steps.map((step) => ({ description: step.description, key: createId() }));
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  existingIngredientNames,
  existingTags,
  existingUnits,
  onCancel,
  onSave,
  defaultAuthor = "",
  initialRecipe,
  onDelete,
  submitLabel = "Save",
}) => {
  const [title, setTitle] = useState(initialRecipe?.title ?? "");
  const [description, setDescription] = useState(
    initialRecipe?.description ?? ""
  );
  const [author, setAuthor] = useState(
    initialRecipe ? (initialRecipe.author ?? "") : defaultAuthor
  );
  const authorEdited = useRef(false);

  // The add-recipe form stays mounted between visits so a draft survives a
  // detour, which means a name set in Settings afterwards has to reach it here.
  useEffect(() => {
    if (!initialRecipe && !authorEdited.current) setAuthor(defaultAuthor);
  }, [defaultAuthor, initialRecipe]);
  const [servingsText, setServingsText] = useState(
    String(initialRecipe?.people_served ?? 2)
  );
  const [tags, setTags] = useState<string[]>(initialRecipe?.tags ?? []);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() =>
    toIngredientRows(initialRecipe?.ingredients ?? [])
  );
  const [steps, setSteps] = useState<StepRow[]>(() =>
    toStepRows(initialRecipe?.steps ?? [])
  );
  const [errors, setErrors] = useState<FormErrors>({});

  // "to taste" leads the unit suggestions so it stays discoverable even in a
  // cookbook that has no units recorded yet.
  const unitSuggestions = useMemo(
    () => [TO_TASTE, ...existingUnits.filter((unit) => !isToTaste(unit))],
    [existingUnits]
  );

  const servings = useMemo(() => {
    const parsed = Number(servingsText);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 1;
  }, [servingsText]);

  const updateIngredient = (key: string, patch: Partial<IngredientRow>) => {
    setIngredients((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  };

  const removeIngredient = (key: string) => {
    setIngredients((current) =>
      current.length === 1
        ? [newIngredientRow()]
        : current.filter((row) => row.key !== key)
    );
  };

  const updateStep = (key: string, description: string) => {
    setSteps((current) =>
      current.map((row) => (row.key === key ? { ...row, description } : row))
    );
  };

  const removeStep = (key: string) => {
    setSteps((current) =>
      current.length === 1
        ? [{ description: "", key: createId() }]
        : current.filter((row) => row.key !== key)
    );
  };

  const moveStep = (index: number, offset: number) => {
    const target = index + offset;
    setSteps((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    const named = ingredients.filter((row) => row.name.trim());
    const badAmount = named.find(
      (row) => !isToTaste(row.unit) && !(Number(row.amountText) > 0)
    );

    const draft: RecipeDraft = {
      description,
      id: initialRecipe?.id,
      ingredients: named.map((row) => ({
        amount: isToTaste(row.unit) ? ("to taste" as const) : Number(row.amountText),
        name: row.name,
        unit: isToTaste(row.unit) ? undefined : row.unit,
      })),
      people_served: servings,
      steps: steps.map((row, index) => ({
        description: row.description,
        order: index + 1,
      })),
      tags,
      times_cooked: initialRecipe?.times_cooked ?? 0,
      title,
      ...(author.trim() ? { author } : {}),
      ...(initialRecipe?.last_cooked_on
        ? { last_cooked_on: initialRecipe.last_cooked_on }
        : {}),
    };

    const nextErrors: FormErrors = validateDraft(draft);
    if (badAmount) {
      nextErrors.amounts = `Give "${badAmount.name.trim()}" an amount above 0, or mark it as "to taste".`;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave(draftToRecipe(draft));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="Spaghetti carbonara"
            placeholderTextColor={theme.muted}
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <Text style={[styles.label, formStyles.spacedLabel]}>Description</Text>
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="What makes this dish worth cooking?"
            placeholderTextColor={theme.muted}
            style={[styles.input, styles.inputMultiline]}
            value={description}
          />

          <Text style={[styles.label, formStyles.spacedLabel]}>Servings</Text>
          <View style={styles.row}>
            <Pressable
              accessibilityLabel="Fewer servings"
              accessibilityRole="button"
              onPress={() => setServingsText(String(Math.max(1, servings - 1)))}
              style={({ pressed }) => [
                formStyles.stepper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="remove" size={20} color={theme.text} />
            </Pressable>
            <TextInput
              inputMode="numeric"
              keyboardType="number-pad"
              onBlur={() => setServingsText(String(servings))}
              onChangeText={setServingsText}
              style={[styles.input, formStyles.servingsInput]}
              value={servingsText}
            />
            <Pressable
              accessibilityLabel="More servings"
              accessibilityRole="button"
              onPress={() => setServingsText(String(servings + 1))}
              style={({ pressed }) => [
                formStyles.stepper,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="add" size={20} color={theme.text} />
            </Pressable>
            <Text style={styles.mutedText}>
              {servings === 1 ? "person" : "people"}
            </Text>
          </View>

          <Text style={[styles.label, formStyles.spacedLabel]}>
            Author (optional)
          </Text>
          <TextInput
            onChangeText={(text) => {
              authorEdited.current = true;
              setAuthor(text);
            }}
            placeholder="Who wrote this recipe?"
            placeholderTextColor={theme.muted}
            style={styles.input}
            value={author}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <TagInput onChange={setTags} suggestions={existingTags} value={tags} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ingredients</Text>

          <Text style={[styles.mutedText, formStyles.sectionHelp]}>
            Set the unit to &quot;to taste&quot; for anything measured by eye.
          </Text>

          {ingredients.map((row) => {
            const toTaste = isToTaste(row.unit);

            return (
              <View key={row.key} style={[formStyles.listRow, formStyles.ingredientRow]}>
                <SuggestInput
                  accessibilityLabel="Ingredient"
                  onChangeText={(name) => updateIngredient(row.key, { name })}
                  placeholder="Ingredient"
                  style={formStyles.ingredientNameField}
                  suggestions={existingIngredientNames}
                  value={row.name}
                />
                <TextInput
                  accessibilityLabel="Amount"
                  editable={!toTaste}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  onChangeText={(amountText) =>
                    updateIngredient(row.key, { amountText })
                  }
                  placeholder="Qty"
                  placeholderTextColor={theme.muted}
                  style={[
                    styles.input,
                    formStyles.amountInput,
                    toTaste && formStyles.disabledInput,
                  ]}
                  value={toTaste ? "" : row.amountText}
                />
                <SuggestInput
                  accessibilityLabel="Unit"
                  inputStyle={toTaste && formStyles.toTasteInput}
                  onChangeText={(unit) => updateIngredient(row.key, { unit })}
                  placeholder="Unit"
                  style={formStyles.unitField}
                  suggestions={unitSuggestions}
                  value={row.unit}
                />
                <Pressable
                  accessibilityLabel="Remove ingredient"
                  accessibilityRole="button"
                  onPress={() => removeIngredient(row.key)}
                  style={({ pressed }) => [
                    formStyles.iconButton,
                    formStyles.ingredientDelete,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </Pressable>
              </View>
            );
          })}

          {errors.ingredients && (
            <Text style={styles.errorText}>{errors.ingredients}</Text>
          )}
          {errors.amounts && (
            <Text style={styles.errorText}>{errors.amounts}</Text>
          )}

          <AppButton
            label="Add ingredient"
            onPress={() =>
              setIngredients((current) => [...current, newIngredientRow()])
            }
            style={formStyles.addRowButton}
            variant="secondary"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Steps</Text>

          {steps.map((row, index) => (
            <View key={row.key} style={[formStyles.listRow, formStyles.stepRow]}>
              <TextInput
                accessibilityLabel={`Step ${index + 1}`}
                multiline
                onChangeText={(text) => updateStep(row.key, text)}
                placeholder="Describe this step"
                placeholderTextColor={theme.muted}
                style={[styles.input, styles.inputMultiline, formStyles.stepInput]}
                value={row.description}
              />

              <View style={formStyles.stepControls}>
                <Pressable
                  accessibilityLabel={`Move step ${index + 1} up`}
                  accessibilityRole="button"
                  disabled={index === 0}
                  onPress={() => moveStep(index, -1)}
                  style={({ pressed }) => [
                    formStyles.iconButton,
                    pressed && styles.buttonPressed,
                    index === 0 && formStyles.iconButtonDisabled,
                  ]}
                >
                  <Ionicons name="arrow-up" size={18} color={theme.muted} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Remove step ${index + 1}`}
                  accessibilityRole="button"
                  onPress={() => removeStep(row.key)}
                  style={({ pressed }) => [
                    formStyles.iconButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move step ${index + 1} down`}
                  accessibilityRole="button"
                  disabled={index === steps.length - 1}
                  onPress={() => moveStep(index, 1)}
                  style={({ pressed }) => [
                    formStyles.iconButton,
                    pressed && styles.buttonPressed,
                    index === steps.length - 1 && formStyles.iconButtonDisabled,
                  ]}
                >
                  <Ionicons name="arrow-down" size={18} color={theme.muted} />
                </Pressable>
              </View>
            </View>
          ))}

          {errors.steps && <Text style={styles.errorText}>{errors.steps}</Text>}

          <AppButton
            label="Add step"
            onPress={() =>
              setSteps((current) => [
                ...current,
                { description: "", key: createId() },
              ])
            }
            style={formStyles.addRowButton}
            variant="secondary"
          />
        </View>

        <View style={formStyles.footer}>
          <AppButton label={submitLabel} onPress={handleSave} />
          <AppButton label="Cancel" onPress={onCancel} variant="secondary" />
          {onDelete && (
            <AppButton
              label="Delete recipe"
              onPress={onDelete}
              variant="danger"
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const formStyles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  spacedLabel: {
    marginTop: spacing.lg,
  },
  stepper: {
    alignItems: "center",
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  servingsInput: {
    textAlign: "center",
    width: 72,
  },
  listRow: {
    borderTopColor: theme.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  sectionHelp: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  ingredientNameField: {
    flex: 3,
  },
  amountInput: {
    flex: 1,
    minWidth: 48,
    paddingHorizontal: spacing.sm,
    textAlign: "center",
  },
  unitField: {
    flex: 2,
  },
  toTasteInput: {
    backgroundColor: theme.primarySoft,
    borderColor: theme.primary,
    color: theme.primary,
  },
  disabledInput: {
    backgroundColor: theme.background,
    color: theme.muted,
  },
  iconButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 32,
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  ingredientDelete: {
    // Taller than the step controls so it centres against the input beside it.
    height: 42,
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  stepInput: {
    flex: 1,
  },
  stepControls: {
    alignItems: "center",
    // Matches inputMultiline's minHeight so the stack never outgrows the field.
    height: 90,
    justifyContent: "space-between",
  },
  addRowButton: {
    marginTop: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
});
