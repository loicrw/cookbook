import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { styles, theme } from "../styles/common";

/**
 * Shown until the stored data has been read.
 *
 * Screens that render stored data need this rather than their empty state: the
 * web build is prerendered with nothing stored, so drawing the empty state
 * first and the real data a tick later breaks hydration.
 */
export const LoadingScreen: React.FC = () => (
  <View style={[styles.screen, loadingStyles.centered]}>
    <ActivityIndicator color={theme.primary} />
  </View>
);

const loadingStyles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
