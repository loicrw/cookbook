import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { Recipe } from "@/src/types/app";
import {
  AppButton,
  ConfirmDialog,
  FontSizeSlider,
  Text,
  TextInput,
} from "@/src/components";
import { useRecipes, useSettings } from "@/src/context/AppDataContext";
import { useNotice } from "@/src/context/NoticeContext";
import { DATA_VERSION } from "@/src/constants/storage";
import { FONT_SIZE_LEVELS } from "@/src/constants/settings";
import {
  exportRecipes,
  exportRecipeTemplate,
  importRecipes,
} from "@/src/utils/fileOperations";
import { RecipeParseError } from "@/src/utils/recipes";
import { plural } from "@/src/utils/text";
import { spacing, styles, theme } from "@/src/styles/common";

const APP_VERSION = Constants.expoConfig?.version ?? "unknown";

export default function SettingsScreen() {
  const { appendRecipes, recipes, replaceRecipes } = useRecipes();
  const { settings, setAuthorName, setFontSizeLevel } = useSettings();
  const notify = useNotice();
  const [busy, setBusy] = useState(false);
  // Recipes read from a file, held until the user picks add vs replace.
  const [pending, setPending] = useState<Recipe[] | null>(null);

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportRecipes(recipes);
    } catch (error) {
      notify(
        "Export failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleExportTemplate = async () => {
    setBusy(true);
    try {
      await exportRecipeTemplate();
    } catch (error) {
      notify(
        "Export failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const imported = await importRecipes();
      if (imported) setPending(imported);
    } catch (error) {
      notify(
        "Import failed",
        error instanceof RecipeParseError
          ? error.message
          : "The file could not be read. Please check it and try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const applyImport = (mode: "add" | "replace") => {
    if (!pending) return;
    const count = pending.length;

    if (mode === "add") {
      appendRecipes(pending);
    } else {
      replaceRecipes(pending);
    }

    setPending(null);
    notify(
      "Import complete",
      mode === "add"
        ? `Added ${plural(count, "recipe")} to your cookbook.`
        : `Your cookbook now holds the ${plural(count, "recipe")} from that file.`
    );
  };

  // With an empty cookbook, adding and replacing do the same thing, so only the
  // add option is offered.
  const cookbookIsEmpty = recipes.length === 0;
  const importMessage = !pending
    ? ""
    : cookbookIsEmpty
      ? `Read ${plural(pending.length, "recipe")} from that file. Your cookbook is empty, so ${pending.length === 1 ? "it" : "they"} will be added as ${pending.length === 1 ? "it is" : "they are"}.`
      : `Read ${plural(pending.length, "recipe")} from that file. Add ${pending.length === 1 ? "it" : "them"} alongside your ${plural(recipes.length, "recipe")}, or replace your cookbook entirely?`;

  return (
    <ScrollView
      contentContainerStyle={settingsStyles.content}
      style={styles.screen}
    >
      {/*
        Preferences come first on purpose: the letter size applies to this
        screen too, so anything above the slider would grow and slide the
        slider out from under the finger dragging it.
      */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={settingsStyles.preferenceHeader}>
          <Text style={styles.label}>Font size</Text>
          <Text style={styles.mutedText}>
            {FONT_SIZE_LEVELS[settings.fontSizeLevel].label}
          </Text>
        </View>

        <FontSizeSlider
          level={settings.fontSizeLevel}
          onChange={setFontSizeLevel}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your cookbook</Text>

        <Text style={styles.label}>My name</Text>
        <TextInput
          onChangeText={setAuthorName}
          placeholder="Who is cooking?"
          placeholderTextColor={theme.muted}
          style={styles.input}
          value={settings.authorName}
        />
        <Text style={[styles.mutedText, settingsStyles.hint]}>
          Names your cookbook on the home screen and is set as the author of new
          recipes. Recipes you have already saved keep their own author.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data</Text>

        <Text style={[styles.mutedText, settingsStyles.help]}>
          Recipes live on this device only. Export a JSON copy to back them up or
          move them to another device.
        </Text>

        <View style={settingsStyles.actions}>
          <AppButton
            disabled={busy}
            label="Import recipes"
            onPress={handleImport}
            style={settingsStyles.actionButton}
            variant="secondary"
          />
          <AppButton
            disabled={busy || recipes.length === 0}
            label="Export recipes"
            onPress={handleExport}
            style={settingsStyles.actionButton}
          />
        </View>

        <View style={settingsStyles.divider} />

        <Text style={[styles.mutedText, settingsStyles.help]}>
          The template describes the file format an import expects. Hand it to an
          assistant and it can write a cookbook file you can import here.
        </Text>

        <AppButton
          disabled={busy}
          label="Export recipe template (for agents)"
          onPress={handleExportTemplate}
          variant="secondary"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Row label="App version" value={APP_VERSION} />
        <Row label="Data format" value={`v${DATA_VERSION}`} />
        <Row
          label="Recipes stored"
          value={String(recipes.length)}
        />
      </View>

      <ConfirmDialog
        actions={[
          {
            label: cookbookIsEmpty ? "Add to my cookbook" : "Add to my recipes",
            onPress: () => applyImport("add"),
          },
          ...(cookbookIsEmpty
            ? []
            : [
                {
                  label: "Replace everything",
                  onPress: () => applyImport("replace"),
                  variant: "danger" as const,
                },
              ]),
          {
            label: "Cancel",
            onPress: () => setPending(null),
            variant: "secondary" as const,
          },
        ]}
        message={importMessage}
        onDismiss={() => setPending(null)}
        title="Import recipes"
        visible={pending !== null}
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={settingsStyles.row}>
      <Text style={styles.mutedText}>{label}</Text>
      <Text style={settingsStyles.rowValue}>{value}</Text>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  row: {
    alignItems: "center",
    borderTopColor: theme.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowValue: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "600",
  },
  help: {
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: 13,
    marginTop: spacing.sm,
  },
  divider: {
    borderTopColor: theme.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  preferenceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
