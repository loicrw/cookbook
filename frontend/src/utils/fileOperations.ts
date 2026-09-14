import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { Recipe, RecipeExport } from "../types/app";
import { DATA_VERSION } from "../constants/storage";
import {
  RECIPE_TEMPLATE,
  RECIPE_TEMPLATE_FILE_NAME,
} from "../constants/recipeTemplate";
import { parseRecipes, RecipeParseError } from "./recipes";

function exportFileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `cookbook-${stamp}.json`;
}

/** Writes every recipe to a JSON file: a download on web, a share sheet on native. */
export async function exportRecipes(recipes: Recipe[]): Promise<void> {
  if (!recipes.length) {
    throw new Error("There are no recipes to export yet.");
  }

  const payload: RecipeExport = {
    exportedAt: new Date().toISOString(),
    recipes,
    version: DATA_VERSION,
  };

  await writeJson(JSON.stringify(payload, null, 2), exportFileName());
}

/**
 * Writes the import format's own description to a file, for handing to an LLM
 * that is being asked to write a cookbook file.
 */
export async function exportRecipeTemplate(): Promise<void> {
  await writeJson(
    JSON.stringify(RECIPE_TEMPLATE, null, 2),
    RECIPE_TEMPLATE_FILE_NAME
  );
}

async function writeJson(json: string, fileName: string): Promise<void> {
  if (Platform.OS === "web") {
    exportWeb(json, fileName);
  } else {
    await exportNative(json, fileName);
  }
}

function exportWeb(json: string, fileName: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

async function exportNative(json: string, fileName: string): Promise<void> {
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: "application/json" });
  }
}

/**
 * Lets the user pick a cookbook JSON file and returns the recipes it contains.
 * Returns null if the picker was dismissed; throws RecipeParseError if the file
 * is not a usable cookbook.
 */
export async function importRecipes(): Promise<Recipe[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return null;

  const content =
    Platform.OS === "web"
      ? await readWeb(result.assets[0])
      : await FileSystem.readAsStringAsync(result.assets[0].uri);

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new RecipeParseError("That file is not valid JSON.");
  }

  return parseRecipes(parsed);
}

async function readWeb(
  asset: DocumentPicker.DocumentPickerAsset
): Promise<string> {
  const file = asset.file;
  if (!file) {
    throw new RecipeParseError("The selected file could not be read.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () =>
      reject(new RecipeParseError("The selected file could not be read."));
    reader.readAsText(file);
  });
}
