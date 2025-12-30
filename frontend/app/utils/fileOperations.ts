import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { AppData } from "../types/app";
import { loadAppData } from "./local_storage";

export async function exportData(): Promise<void> {
  try {
    const data = await loadAppData();
    if (!data) {
      throw new Error("No data to export");
    }

    const json = JSON.stringify(data, null, 2);

    if (Platform.OS === "web") {
      exportWeb(json);
    } else {
      await exportNative(json);
    }
  } catch (error) {
    console.error("Failed to export data:", error);
    throw error;
  }
}

function exportWeb(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

async function exportNative(json: string): Promise<void> {
  const fileUri = FileSystem.documentDirectory + `backup-${Date.now()}.json`;

  await FileSystem.writeAsStringAsync(fileUri, json);
  await Sharing.shareAsync(fileUri);
}

export async function importData(): Promise<AppData | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });

    if (result.canceled) return null;

    if (Platform.OS === "web") {
      return await importWeb(result.assets[0]);
    } else {
      return await importNative(result.assets[0]);
    }
  } catch (error) {
    console.error("Failed to import data:", error);
    throw error;
  }
}

async function importWeb(asset: any): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: AppData = JSON.parse(content);
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error}`));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(asset.file);
  });
}

async function importNative(asset: any): Promise<AppData> {
  const content = await FileSystem.readAsStringAsync(asset.uri);
  return JSON.parse(content);
}
