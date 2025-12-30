import React from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { exportData } from "../utils/fileOperations";
import { styles } from "../styles/common";

export const ExportButton: React.FC = () => {
  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Export Failed", "Failed to export data. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleExport}
      >
        <Text style={styles.buttonText}>Export Backup</Text>
      </Pressable>
    </View>
  );
};
