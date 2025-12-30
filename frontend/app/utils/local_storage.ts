import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "../types/app";
import { STORAGE_KEY } from "../constants/storage";

export async function loadAppData(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to load app data:", error);
    return null;
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