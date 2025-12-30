import React from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { importData } from "../utils/fileOperations";
import { AppData } from "../types/app";
import { styles } from "../styles/common";

interface ImportButtonProps {
  onImport: (data: AppData) => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
  const handleImport = async () => {
    try {
      const importedData = await importData();
      if (importedData) {
        onImport(importedData);
      }
    } catch (error) {
      console.error("Import failed:", error);
      Alert.alert(
        "Import Failed",
        "Failed to import data. Please check the file and try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleImport}
      >
        <Text style={styles.buttonText}>Import Backup</Text>
      </Pressable>
    </View>
  );
};
