import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ManualItem } from "../types/app";
import { spacing, styles, theme } from "../styles/common";
import { AppButton } from "./AppButton";
import { SuggestInput } from "./SuggestInput";
import { Text, TextInput } from "./Text";

interface ManualItemInputProps {
  /** Names already used in the cookbook, offered while typing. */
  existingNames: string[];
  /** Units already used in the cookbook, offered while typing. */
  existingUnits: string[];
  onAdd: (item: Omit<ManualItem, "id">) => void;
}

/**
 * Puts one line on the shopping list by hand. It reads like the recipe form's
 * ingredient row, but the list also holds things that are not ingredients, so
 * the field says "item" and both the amount and the unit can be left empty.
 */
export const ManualItemInput: React.FC<ManualItemInputProps> = ({
  existingNames,
  existingUnits,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Give the item a name.");
      return;
    }

    const typed = amountText.trim();
    const amount = Number(typed);
    if (typed && !(amount > 0)) {
      setError("An amount has to be a number above 0, or left empty.");
      return;
    }

    onAdd({ name, ...(typed ? { amount } : {}), unit });
    setName("");
    setAmountText("");
    setUnit("");
    setError(null);
  };

  return (
    <View>
      <View style={inputStyles.row}>
        <SuggestInput
          accessibilityLabel="Item"
          onChangeText={setName}
          placeholder="Item"
          style={inputStyles.nameField}
          suggestions={existingNames}
          value={name}
        />
        <TextInput
          accessibilityLabel="Amount (optional)"
          inputMode="decimal"
          keyboardType="decimal-pad"
          onChangeText={setAmountText}
          placeholder="Qty"
          placeholderTextColor={theme.muted}
          style={[styles.input, inputStyles.amountField]}
          value={amountText}
        />
        <SuggestInput
          accessibilityLabel="Unit (optional)"
          onChangeText={setUnit}
          placeholder="Unit"
          style={inputStyles.unitField}
          suggestions={existingUnits}
          value={unit}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <AppButton
        label="Add item"
        onPress={handleAdd}
        style={inputStyles.add}
        variant="secondary"
      />
    </View>
  );
};

const inputStyles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  nameField: {
    flex: 3,
  },
  amountField: {
    flex: 1,
    minWidth: 48,
    paddingHorizontal: spacing.sm,
    textAlign: "center",
  },
  unitField: {
    flex: 2,
  },
  add: {
    marginTop: spacing.md,
  },
});
