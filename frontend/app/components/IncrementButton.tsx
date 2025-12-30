import React from "react";
import { Text, View, Pressable } from "react-native";
import { AppData } from "../types/app";
import { styles } from "../styles/common";

interface IncrementButtonProps {
  data: AppData;
  onIncrement: () => void;
}

export const IncrementButton: React.FC<IncrementButtonProps> = ({
  data,
  onIncrement,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.countText}>Count: {data.count}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={onIncrement}
      >
        <Text style={styles.buttonText}>Press Me</Text>
      </Pressable>
    </View>
  );
};
