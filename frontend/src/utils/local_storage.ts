import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "../types/app";
import { STORAGE_KEY } from "../constants/storage";
import { emptyAppData, normalizeAppData } from "./recipes";

/**
 * Reads the cookbook from device storage. Anything unreadable or written by an
 * older build degrades to an empty cookbook rather than crashing the app.
 */
export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? normalizeAppData(JSON.parse(raw)) : emptyAppData();
  } catch (error) {
    console.error("Failed to load app data:", error);
    return emptyAppData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save app data:", error);
    throw error;
  }
}
