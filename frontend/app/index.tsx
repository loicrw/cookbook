import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { AppData } from "./types/app";
import { loadAppData, saveAppData } from "./utils/local_storage";
import { IncrementButton, ExportButton, ImportButton } from "./components";

export default function Index() {
  const [appData, setAppData] = useState<AppData>({
    version: 1,
    count: 0,
    lastUpdated: Date.now(),
  });

  // Load data once on mount
  useEffect(() => {
    const loadData = async () => {
      const saved = await loadAppData();
      if (saved) {
        setAppData(saved);
      }
    };
    loadData();
  }, []);

  // Persist data whenever it changes
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const handleIncrement = () => {
    setAppData((prevData) => ({
      ...prevData,
      count: prevData.count + 1,
      lastUpdated: Date.now(),
    }));
  };

  const handleImport = (importedData: AppData) => {
    setAppData(importedData);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Cookbook App v0.2</Text>
      <IncrementButton data={appData} onIncrement={handleIncrement} />
      <ExportButton />
      <ImportButton onImport={handleImport} />
    </View>
  );
}
